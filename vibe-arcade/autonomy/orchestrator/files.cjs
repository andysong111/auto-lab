'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const ID = /^GAME-\d{8}-\d{3,6}$/;
function safePath(root, relative) {
  if (typeof relative !== 'string' || relative.includes('\\') || path.isAbsolute(relative) || relative.split('/').some(x => x === '..' || x === '.')) throw Error('path_isolation');
  const target = path.resolve(root, relative), base = path.resolve(root);
  if (!target.startsWith(base + path.sep)) throw Error('path_isolation');
  let current = base;
  if (fs.existsSync(base) && fs.lstatSync(base).isSymbolicLink()) throw Error('path_isolation');
  for (const part of path.relative(base, target).split(path.sep)) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw Error('path_isolation');
  }
  return target;
}
function atomicJSON(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const tmp = file + '.' + crypto.randomUUID() + '.tmp';
  const fd = fs.openSync(tmp, 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value, null, 2) + '\n'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(tmp, file);
}
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function listFiles(dir, prefix = '') {
  if (fs.lstatSync(dir).isSymbolicLink()) throw Error('path_isolation');
  return fs.readdirSync(dir).sort().flatMap(name => {
    const rel = prefix ? prefix + '/' + name : name, file = path.join(dir, name), s = fs.lstatSync(file);
    if (s.isSymbolicLink() || (!s.isFile() && !s.isDirectory())) throw Error('path_isolation');
    return s.isDirectory() ? listFiles(file, rel) : [rel];
  });
}
function hashTree(dir) {
  const h = crypto.createHash('sha256');
  for (const f of listFiles(dir)) { h.update(f + '\0'); h.update(fs.readFileSync(path.join(dir, f))); h.update('\0'); }
  return h.digest('hex');
}
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
const requiredFiles = ['core.js', 'app.js', 'view/art.js', 'style.css', 'index.html', 'README.md'];
function inspectGame(dir) {
  const files = listFiles(dir);
  for (const file of requiredFiles) if (!files.includes(file)) throw Error('missing_assets: ' + file);
  let bytes = 0;
  for (const f of files) {
    if (!/^[a-zA-Z0-9_/-]+\.(js|css|html|json|md|svg|png|webp|jpg|ogg|wav)$/.test(f) || /(?:^|\/)(?:node_modules|secrets?)(?:\/|\.)/i.test(f)) throw Error('path_isolation: forbidden game file ' + f);
    bytes += fs.statSync(path.join(dir, f)).size;
  }
  if (bytes > 20 * 1024 * 1024 || files.length > 250) throw Error('game_resource_budget');
  return files;
}
function copyGame(from, to) {
  inspectGame(from); fs.mkdirSync(to, {recursive: true});
  for (const f of listFiles(from)) {
    const dest = safePath(to, f); fs.mkdirSync(path.dirname(dest), {recursive: true}); fs.copyFileSync(path.join(from, f), dest);
  }
}
module.exports = {ID, safePath, atomicJSON, readJSON, listFiles, hashTree, hash, inspectGame, copyGame, requiredFiles};
