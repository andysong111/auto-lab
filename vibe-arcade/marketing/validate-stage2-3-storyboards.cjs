'use strict';
// Planning-only validator. This does not authorize rendering, scheduling or publishing.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { validate: validateFlagContent } = require('./validate-flag-content.cjs');
const EXPECTED = {
  dd_fc01: ['gyro-drop', 'gd-descent-v2', '/descent/', 600, 840],
  cp_fc01: ['core-pins', 'cp-phaser-v1', '/challengers/play?game=core-pins', 720, 900],
  nm_fc01: ['nova-merge', 'nm-phaser-v1', '/challengers/play?game=nova-merge', 720, 900]
};
const FLAGS = new Set(['KR', 'US', 'JP', 'IN', 'BR']);
const NO_CLAIMS = /(?:every (?:verified )?run counts|one run\s*=|\bverified\b|\bleads\b|\bwins\b|\bmillions\b|world\s*#)/i;
function rect(r, label) {
  assert(r && ['x','y','width','height'].every(k => Number.isFinite(r[k])), label + ': invalid rectangle');
  assert(r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0, label + ': nonpositive/outside bounds');
  assert(r.x + r.width <= 1080 && r.y + r.height <= 1920, label + ': outside canvas');
}
function overlap(a, b) {
  return Math.max(0, Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)) *
    Math.max(0, Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
}
function validate(pack) {
  assert.equal(pack.schemaVersion, 'loopjolt-marketing-storyboards/2.3');
  assert.equal(pack.stage, 'marketing-2-3');
  assert.equal(pack.status, 'scripts_ready_media_pending');
  assert.match(pack.sourceCommit, /^[a-f0-9]{40}$/);
  assert.deepEqual(pack.permissions, {render:false,schedule:false,publish:false,rankedSubmit:false});
  assert.deepEqual(pack.verification, {repositoryRulesReviewed:true,liveGameplayReviewed:false,mediaReviewed:false,leaderboardSnapshotTaken:false});
  const s = pack.shared;
  assert.equal(s.format, 'FLAG_CHALLENGE');
  assert.equal(s.language, 'en');
  assert.equal(s.durationSeconds, 18);
  assert.deepEqual(s.canvas, {width:1080,height:1920});
  assert.equal(s.captureMode, 'practice');
  assert.equal(s.disclosure, 'PRACTICE HIGHLIGHTS');
  assert(s.firstFlagAtSeconds >= 0 && s.firstFlagAtSeconds <= 0.25);
  assert.equal(s.gameplayStartsAtSeconds, 0);
  assert.equal(s.flagImages.requiredType, 'real_svg_or_png');
  assert.equal(s.flagImages.recolor, false);
  assert.equal(s.flagImages.assetsReady, false);
  assert(s.flagImages.heroWidthPx >= 120);
  assert(s.countries.every(c => FLAGS.has(c.code)), 'Unreviewed invitation flag');
  const l = s.layout;
  for (const key of ['criticalGameplaySafeRect','competitionPlate','ctaPlate','flagRow','hookBox','disclosureBox']) rect(l[key], key);
  assert.deepEqual(l.criticalGameplaySafeRect, {x:90,y:300,width:900,height:1240});
  assert.equal(overlap(l.competitionPlate,l.ctaPlate), 0, 'Opaque plates must not overlap');
  assert(l.ctaPlate.y >= 1540 && l.ctaPlate.y+l.ctaPlate.height <= 1670, 'CTA enters bottom-250px exclusion');
  assert(l.hookFontPx >= 72 && l.hookFontPx <= 92 && l.hookMaxLines === 1);
  assert(l.disclosureFontPx >= 24);
  assert.equal(l.minUnoccludedGameplayAreaRatio, 0.65);
  assert(s.mediaGate.fullDecode && s.mediaGate.fullOutputFreezeScan && s.mediaGate.gameplayFreezeRoiRequired);
  assert.equal(s.mediaGate.maxUnplannedStaticSeconds, 0.6);
  assert.deepEqual(s.mediaGate.gameplayRange, [0,12]);
  assert.deepEqual(s.mediaGate.declaredGraphicRanges, [[12,15],[15,18]]);
  assert.deepEqual(s.mediaGate.inspectPercent, [0,25,50,75,100]);
  assert(s.mediaGate.full1xPlayback && s.mediaGate.coverCropReview && s.mediaGate.noAnimatedOverlayMaskingFrozenGameplay);
  const crop = s.cover.crop;
  rect(crop, 'cover crop');
  assert.deepEqual(crop, {x:108,y:420,width:864,height:1080});
  assert(s.cover.flagRowY >= crop.y && s.cover.flagRowY+80 <= crop.y+crop.height);
  assert(s.cover.hookY >= crop.y && s.cover.hookY+90 <= crop.y+crop.height);
  assert(Array.isArray(pack.games) && pack.games.length === 3);
  assert.equal(new Set(pack.games.map(g=>g.id)).size, 3);
  const coverage = {};
  for (const g of pack.games) {
    const expected = EXPECTED[g.id];
    assert(expected, 'Unexpected game identity');
    assert.deepEqual([g.game,g.version,g.entryPath,g.sourceCanvas.width,g.sourceCanvas.height], expected);
    const u = new URL(g.capturePath, 'https://capture.invalid');
    assert.equal(u.searchParams.get('capture'), '1');
    u.searchParams.delete('capture');
    assert.equal(u.pathname+(u.search ? u.search : ''), g.entryPath);
    validateFlagContent({format:s.format,game:g.game,hook:g.hook,countries:s.countries});
    assert.equal(g.media, null, 'A plan cannot claim captured media');
    assert.deepEqual(g.sourceWindows, [], 'Source timecodes are unbound until capture');
    assert.equal(g.coverSourceFrame, null);
    assert(typeof g.requiredEvent === 'string' && g.requiredEvent.length > 10);
    rect(g.footageRect, g.id+' footage');
    assert(Math.abs(g.footageRect.width/g.sourceCanvas.width-g.footageRect.height/g.sourceCanvas.height) < 1e-9, 'Native aspect ratio changed');
    const area = g.footageRect.width*g.footageRect.height - overlap(g.footageRect,l.competitionPlate) - overlap(g.footageRect,l.ctaPlate);
    coverage[g.id] = Number((area/(1080*1920)).toFixed(6));
    assert(coverage[g.id] >= l.minUnoccludedGameplayAreaRatio, g.id+': gameplay coverage below 65%');
    assert(Array.isArray(g.shots) && g.shots.length === 6);
    let end=0;
    for (const [i,shot] of g.shots.entries()) {
      assert(Number.isFinite(shot.start) && Number.isFinite(shot.end) && shot.start===end && shot.end>shot.start, 'Timeline gap/overlap');
      end=shot.end;
      assert.equal(shot.kind, i<4?'gameplay':i===4?'identity_card':'end_card');
      assert(Array.isArray(shot.copy) && shot.copy.length>0 && shot.copy.every(t=>typeof t==='string' && t.trim()));
      assert(typeof shot.action==='string' && shot.action.length>10);
      assert(typeof shot.evidenceRequired==='string' && shot.evidenceRequired.length>10);
      assert(shot.copy.filter(t=>/\d/.test(t)).length<=1, 'Multiple editorial numeric facts');
    }
    assert.equal(g.shots[0].end, 1);
    assert.equal(g.shots[3].end, 12);
    assert.equal(g.shots[4].end, 15);
    assert.equal(end, 18);
    assert.equal(g.shots[0].copy[0], g.hook);
    assert.deepEqual(g.shots[4].copy, ['PICK YOUR FLAG','PLAY RANKED']);
    assert.deepEqual(g.shots[5].copy, ['LOOPJOLT','PLAY FREE','LINK IN BIO']);
    const visible=[g.hook,g.thumbnailText,g.caption,...g.shots.flatMap(x=>x.copy)].join('\n');
    assert(!/\p{Regional_Indicator}/u.test(visible), 'Emoji flag in visible copy');
    assert(!NO_CLAIMS.test(visible), 'Unsupported competitive or verification claim');
  }
  assert.equal(pack.handoff.userDecisionRequiredNow, false);
  return {planningOnly:true,storyboards:pack.games.length,flagPayloads:3,theoreticalUnoccludedArea:coverage,mediaReady:false,publishAllowed:false};
}
function selfTest(pack) {
  const cases = [
    ['publishing enabled',p=>p.permissions.publish=true],
    ['rendering enabled',p=>p.permissions.render=true],
    ['ranked submission enabled',p=>p.permissions.rankedSubmit=true],
    ['live review falsely claimed',p=>p.verification.liveGameplayReviewed=true],
    ['country score injected',p=>p.shared.countries[0].score=100],
    ['duplicate flag',p=>p.shared.countries[1]=p.shared.countries[0]],
    ['unknown invitation flag',p=>p.shared.countries[0].code='ZZ'],
    ['flag too late',p=>p.shared.firstFlagAtSeconds=0.26],
    ['gameplay intro delay',p=>p.shared.gameplayStartsAtSeconds=0.1],
    ['ranked capture',p=>p.shared.captureMode='ranked'],
    ['practice disclosure missing',p=>p.shared.disclosure=''],
    ['flag recolored',p=>p.shared.flagImages.recolor=true],
    ['flag too small',p=>p.shared.flagImages.heroWidthPx=119],
    ['wrong format',p=>p.shared.format='WORLD_BOARD'],
    ['wrong Deep Descent key',p=>p.games[0].game='deep-descent'],
    ['legacy game version',p=>p.games[0].version='gd-phaser-v1'],
    ['capture query removed',p=>p.games[1].capturePath=p.games[1].entryPath],
    ['media fabricated',p=>p.games[0].media='not-created.mp4'],
    ['timecodes fabricated',p=>p.games[0].sourceWindows=[{start:0,end:12}]],
    ['timeline gap',p=>p.games[0].shots[1].start=1.1],
    ['timeline overlap',p=>p.games[1].shots[1].start=0.9],
    ['wrong duration',p=>p.games[0].shots[5].end=19],
    ['freeze limit weakened',p=>p.shared.mediaGate.maxUnplannedStaticSeconds=1],
    ['ROI scan disabled',p=>p.shared.mediaGate.gameplayFreezeRoiRequired=false],
    ['playback review disabled',p=>p.shared.mediaGate.full1xPlayback=false],
    ['CTA hidden by app controls',p=>p.shared.layout.ctaPlate.y=1700],
    ['thumbnail flags outside crop',p=>p.shared.cover.flagRowY=78],
    ['aspect ratio distorted',p=>p.games[0].footageRect.width=900],
    ['footage coverage too low',p=>p.games[0].footageRect={x:90,y:300,width:900,height:1260}],
    ['every-run claim',p=>p.games[0].caption='Every verified run counts.'],
    ['fabricated national lead',p=>p.games[1].caption='Korea leads.'],
    ['emoji flag',p=>p.games[2].caption+=' '+String.fromCodePoint(0x1f1f0,0x1f1f7)],
    ['multiple numeric overlays',p=>p.games[0].shots[1].copy=['48 RINGS','3 BOSSES']],
    ['result claimed before media',p=>p.status='published']
  ];
  validate(pack);
  for (const [label,mutate] of cases) {
    const p=structuredClone(pack); mutate(p);
    assert.throws(()=>validate(p), undefined, 'Failed to reject: '+label);
  }
  return {positivePacks:1,negativeCases:cases.length,passed:cases.length+1};
}
if (require.main===module) {
  try {
    const args=process.argv.slice(2);
    assert(args.every(a=>a==='--self-test'||!a.startsWith('--')), 'Unknown option; no production mode exists');
    const file=args.find(a=>!a.startsWith('--'))||path.join(__dirname,'stage2-3.storyboards.json');
    const pack=JSON.parse(fs.readFileSync(file,'utf8'));
    console.log(JSON.stringify({validation:validate(pack),...(args.includes('--self-test')?{tests:selfTest(pack)}:{})},null,2));
  } catch (e) { console.error('INVALID STAGE 2-3 PLAN:', e.message); process.exitCode=1; }
}
module.exports={validate,selfTest};
