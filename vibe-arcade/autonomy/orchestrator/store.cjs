'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const {ID, safePath, atomicJSON, readJSON} = require('./files.cjs');
const {validate} = require('./manifest.cjs');
// Store interface is deliberately independent of Supabase: get, put, withLock, artifact.
class FileStore {
  constructor(appRoot) { this.root = path.resolve(appRoot); }
  file(id) { if (!ID.test(id)) throw Error('invalid_game_id'); return safePath(this.root, `autonomy/jobs/${id}/manifest.json`); }
  get(id) { return validate(readJSON(this.file(id))); }
  put(m) { validate(m); atomicJSON(this.file(m.game_id), m); return m; }
  artifact(id, relative) { if (!ID.test(id)) throw Error('invalid_game_id'); return safePath(this.root, `autonomy/artifacts/${id}/${relative}`); }
  async withLock(id, fn) {
    this.file(id);
    const file = safePath(this.root, `autonomy/.locks/${id}.json`);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    const owner = {pid: process.pid, host: os.hostname(), token: require('node:crypto').randomUUID()};
    // A remote host's lease is never stolen; single-host file storage is Phase 1's boundary.
    for (let n = 0; n < 2; n++) {
      try { fs.writeFileSync(file, JSON.stringify(owner), {flag: 'wx'}); break; }
      catch (e) {
        if (e.code !== 'EEXIST') throw e;
        const prior = readJSON(file);
        let alive = true;
        if (prior.host === owner.host) try { process.kill(prior.pid, 0); } catch (err) { if (err.code === 'ESRCH') alive = false; }
        if (alive || n) throw Error('job_locked');
        fs.unlinkSync(file);
      }
    }
    try { return await fn(); }
    finally { if (fs.existsSync(file) && readJSON(file).token === owner.token) fs.unlinkSync(file); }
  }
}
module.exports = {FileStore};
