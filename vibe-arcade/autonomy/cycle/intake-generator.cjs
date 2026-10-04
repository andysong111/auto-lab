'use strict';
const fs=require('node:fs'),path=require('node:path');
const {validateBlueprint,buildModel}=require('./template-runner.cjs');
const foundryRunner=require('../foundry/family-runner.cjs');
const DEFAULT_FOUNDRY_RUNNER='foundry/family-runner.cjs',RUNNER=/^foundry\/[a-z0-9-]+-runner\.cjs$/;

function reviewedRunner(design){
  const relative=design?.runner||DEFAULT_FOUNDRY_RUNNER;
  if(!RUNNER.test(relative))throw Error('invalid_foundry_runner');
  const file=path.resolve(__dirname,'..',relative),root=path.resolve(__dirname,'..');
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file))throw Error('reviewed_foundry_runner_missing');
  const module=relative===DEFAULT_FOUNDRY_RUNNER?foundryRunner:require(file);
  if(!['validateBlueprint','buildModel','main'].every(name=>typeof module[name]==='function'))throw Error('invalid_foundry_runner_contract');
  return {relative,module};
}

const SIGNATURES=[
  {id:'adjacent-chain',ops:['adjacent','adjacent','adjacent']},
  {id:'prefix-reversal',ops:['prefix_reverse','prefix_reverse','prefix_reverse']},
  {id:'anchor-swap',ops:['star','star','star']},
  {id:'prefix-rotation',ops:['prefix_rotate','prefix_rotate','prefix_rotate']},
  {id:'suffix-reversal',ops:['suffix_reverse','suffix_reverse','suffix_reverse']},
  {id:'suffix-rotation',ops:['suffix_rotate','suffix_rotate','suffix_rotate']},
  {id:'adjacent-prefix-anchor',ops:['adjacent','prefix_reverse','star']},
  {id:'anchor-adjacent-suffix',ops:['star','adjacent','suffix_reverse']},
  {id:'prefix-anchor-adjacent',ops:['prefix_reverse','star','adjacent']},
  {id:'suffix-prefix-anchor',ops:['suffix_reverse','prefix_rotate','star']},
  {id:'adjacent-suffix-prefix',ops:['adjacent','suffix_reverse','prefix_rotate']},
  {id:'anchor-prefix-suffix',ops:['star','prefix_reverse','suffix_rotate']},
  {id:'rotate-suffix-adjacent',ops:['prefix_rotate','suffix_reverse','adjacent']},
  {id:'suffix-anchor-prefix',ops:['suffix_rotate','star','prefix_reverse']},
  {id:'adjacent-anchor-rotate',ops:['adjacent','star','prefix_rotate']},
  {id:'reverse-adjacent-suffix',ops:['prefix_reverse','adjacent','suffix_rotate']},
  {id:'suffix-anchor-rotate',ops:['suffix_reverse','star','prefix_rotate']},
  {id:'anchor-suffix-prefix',ops:['star','suffix_rotate','prefix_reverse']}
];
const THEMES=[
  {title:'Rune Cascade',singular:'Rune',plural:'Runes',arena:'Vault',progress:'ROUNDS',success:'VAULT ALIGNED',failure:'RUNE FRACTURE'},
  {title:'Signal Crown',singular:'Signal',plural:'Signals',arena:'Crown',progress:'ROUNDS',success:'CROWN LOCKED',failure:'SIGNAL BROKE'},
  {title:'Comet Ledger',singular:'Comet',plural:'Comets',arena:'Ledger',progress:'ROUNDS',success:'LEDGER SEALED',failure:'COMET DRIFT'},
  {title:'Prism Queue',singular:'Prism',plural:'Prisms',arena:'Queue',progress:'ROUNDS',success:'QUEUE LOCKED',failure:'PRISM BREAK'},
  {title:'Glyph Harbor',singular:'Glyph',plural:'Glyphs',arena:'Harbor',progress:'ROUNDS',success:'HARBOR SEALED',failure:'GLYPH SCATTER'},
  {title:'Nova Archive',singular:'Nova',plural:'Novas',arena:'Archive',progress:'ROUNDS',success:'ARCHIVE LOCKED',failure:'NOVA DRIFT'},
  {title:'Echo Gallery',singular:'Echo',plural:'Echoes',arena:'Gallery',progress:'ROUNDS',success:'GALLERY ALIGNED',failure:'ECHO FRACTURE'},
  {title:'Orbit Registry',singular:'Orbit',plural:'Orbits',arena:'Registry',progress:'ROUNDS',success:'REGISTRY SEALED',failure:'ORBIT BREAK'},
  {title:'Lumen Gallery',singular:'Lumen',plural:'Lumens',arena:'Gallery',progress:'ROUNDS',success:'LUMENS ALIGNED',failure:'LUMEN SCATTER'},
  {title:'Cipher Yard',singular:'Cipher',plural:'Ciphers',arena:'Yard',progress:'ROUNDS',success:'YARD LOCKED',failure:'CIPHER BREAK'},
  {title:'Shard Vault',singular:'Shard',plural:'Shards',arena:'Vault',progress:'ROUNDS',success:'SHARDS SEALED',failure:'SHARD FRACTURE'},
  {title:'Helix Court',singular:'Helix',plural:'Helixes',arena:'Court',progress:'ROUNDS',success:'COURT ALIGNED',failure:'HELIX BREAK'},
  {title:'Aster Foundry',singular:'Aster',plural:'Asters',arena:'Foundry',progress:'ROUNDS',success:'ASTERS FORGED',failure:'ASTER FRACTURE'},
  {title:'Voxel Atrium',singular:'Voxel',plural:'Voxels',arena:'Atrium',progress:'ROUNDS',success:'ATRIUM ALIGNED',failure:'VOXEL SCATTER'},
  {title:'Quasar Annex',singular:'Quasar',plural:'Quasars',arena:'Annex',progress:'ROUNDS',success:'ANNEX SEALED',failure:'QUASAR DRIFT'},
  {title:'Ember Circuit',singular:'Ember',plural:'Embers',arena:'Circuit',progress:'ROUNDS',success:'CIRCUIT LOCKED',failure:'EMBER BREAK'},
  {title:'Tidal Codex',singular:'Tide',plural:'Tides',arena:'Codex',progress:'ROUNDS',success:'CODEX SEALED',failure:'TIDE FRACTURE'},
  {title:'Aurora Keep',singular:'Aurora',plural:'Auroras',arena:'Keep',progress:'ROUNDS',success:'KEEP ALIGNED',failure:'AURORA SCATTER'}
];
function slugify(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function blueprintFor(sequence,date){
  if(!Number.isInteger(sequence)||sequence<1||sequence>SIGNATURES.length)throw Error('trusted_template_pool_exhausted');
  if(!/^[0-9]{8}$/.test(date||''))throw Error('invalid_date');
  const signature=SIGNATURES[sequence-1],theme=THEMES[sequence-1],slot=300+sequence;
  const bp={
    schema:'playjolt-permutation-blueprint/1',
    game_id:'GAME-'+date+'-'+slot,
    title:theme.title,
    slug:slugify(theme.title),
    signature_id:signature.id,
    ops:signature.ops,
    seeds:Array.from({length:6},(_,i)=>sequence*101+i+31),
    theme:{singular:theme.singular,plural:theme.plural,arena:theme.arena,progress:theme.progress,success:theme.success,failure:theme.failure}
  };
  validateBlueprint(bp);buildModel(bp);return bp;
}
function foundryBlueprintFor(selection,sequence,date){
  if(!selection||selection.schema!=='playjolt-foundry-selection/1'||selection.status!=='SELECTED'||selection.sequence!==sequence)throw Error('invalid_foundry_selection');
  const design=selection.design||{},candidate=design.candidate||{},slot=300+sequence;
  const runner=reviewedRunner(design),foundry={schema:'playjolt-foundry-lineage/1',lane:selection.lane,family_id:design.family_id,design_id:design.id,runner:runner.relative,learning_focus:selection.learning_focus||[],...(design.golden_baseline_id?{golden_baseline_id:design.golden_baseline_id}:{})};
  if(selection.lane==='market-benchmark')Object.assign(foundry,{benchmark_id:selection.benchmark.id,benchmark_url:selection.benchmark.url});
  const seeds=Array.isArray(design.seeds)?design.seeds:Array.from({length:6},(_,i)=>sequence*101+i+31);
  const bp={schema:'playjolt-foundry-blueprint/1',game_id:'GAME-'+date+'-'+slot,title:candidate.title,slug:candidate.slug,family_id:design.family_id,design_id:design.id,lane:selection.lane,runner:runner.relative,theme:candidate.theme,foundry,learning_focus:selection.learning_focus||[],
    ...(selection.benchmark?{benchmark:selection.benchmark}:{}),copy_policy:selection.copy_policy,novelty_contract:design.novelty_contract,
    ...(design.golden_baseline_id?{golden_baseline_id:design.golden_baseline_id}:{}),...(design.variation?{variation:design.variation}:{}),seeds};
  runner.module.validateBlueprint(bp);runner.module.buildModel(bp);return bp;
}
function materialize(outRoot,sequence,date,selectionFile=null){
  const legacy=sequence<=SIGNATURES.length;
  const selection=selectionFile?(typeof selectionFile==='string'?JSON.parse(fs.readFileSync(selectionFile,'utf8')):selectionFile):null;
  const bp=legacy?blueprintFor(sequence,date):foundryBlueprintFor(selection,sequence,date),seq=String(sequence).padStart(2,'0');
  const slot='auto-'+date+'-'+seq,branch='commissioning/'+slot;
  const candidateRel='vibe-arcade/autonomy/commissioning/'+slot;
  const dir=path.join(path.resolve(outRoot),'candidate');fs.rmSync(path.resolve(outRoot),{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
  const runner=legacy?'../../cycle/template-runner.cjs':'../../'+bp.runner;
  const commission="'use strict';\nconst {main}=require('"+runner+"');\nmain(__dirname,process.argv[2]).catch(e=>{console.error(e.stack||e);process.exitCode=1;});\n";
    const request={game_id:bp.game_id,candidate:bp.title,runtime:'Phaser 4.2.1 + GameKit v3 + Feel Kit',paid_calls:true,auto_commission:true,authorized_provider_calls:6,estimated_usd_ceiling:2,production_authorized:false,request_revision:1};
  fs.writeFileSync(path.join(dir,'commission.cjs'),commission);
  fs.writeFileSync(path.join(dir,'blueprint.json'),JSON.stringify(bp,null,2)+'\n');
  fs.writeFileSync(path.join(dir,'queued-request.json'),JSON.stringify(request,null,2)+'\n');
  const meta={schema:'playjolt-intake-materialization/1',sequence,date,branch,slot,candidate_dir:candidateRel,request_path:candidateRel+'/queued-request.json',game_id:bp.game_id,candidate:bp.title,signature_id:bp.signature_id||bp.design_id,lane:bp.lane||'legacy',family_id:bp.family_id||'permutation-ordering-v1'};
  fs.writeFileSync(path.join(path.resolve(outRoot),'meta.json'),JSON.stringify(meta,null,2)+'\n');
  return meta;
}
if(require.main===module){
  const [cmd,out,seq,date,selectionFile]=process.argv.slice(2);
  try{
    if(cmd!=='materialize'||!out)throw Error('usage: intake-generator.cjs materialize OUT SEQUENCE YYYYMMDD');
    const meta=materialize(out,Number(seq),date,selectionFile||null);process.stdout.write(JSON.stringify(meta)+'\n');
  }catch(e){console.error(e.stack||e);process.exit(2);}
}
module.exports={SIGNATURES,THEMES,blueprintFor,foundryBlueprintFor,materialize};
