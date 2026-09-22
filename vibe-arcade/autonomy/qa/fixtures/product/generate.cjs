'use strict';
// Test-only authored fixtures. Never a commissioning proposal or public game.
const fs=require('node:fs'),path=require('node:path');
const {hash,atomicJSON}=require('../../../orchestrator/files.cjs');
const seeds=[7,19,41,73,101,137],projection=['state.stage','state.mask','state.target','state.outcome'];
const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'];
const target=(seed,stage)=>((1<<(stage+2))-1)^(1<<(seed%(stage+2)));
function model(){const m={schema_version:1,projection,seeds:{}};for(const seed of seeds){const nodes={};for(let stage=1;stage<=3;stage++)for(let mask=0;mask<(1<<(stage+2));mask++){const t=target(seed,stage);if(mask===t)continue;const id=stage+':'+mask;nodes[id]={stage,values:[stage,mask,t,'playing'],edges:[]};for(let i=0;i<stage+2;i++){const next=mask^(1<<i);nodes[id].edges.push({action:'a'+i,to:next===t?(stage===3?'success':(stage+1)+':0'):stage+':'+next});}}nodes.success={stage:4,values:[4,0,0,'success'],success:true,edges:[]};m.seeds[seed]={initial:'1:0',nodes};}return m;}
function contract(){return {schema_version:1,
 objective:{visible_selector:'[data-objective]',expected_text:'Match the lit target in all 3 panels'},
 progress:{selector:'[data-product-progress]',state_path:'state.completed',format:'PANELS {value} / 3',milestones:[1,2,3]},
 score:{selector:'[data-game-score]',label_selector:'[data-score-label]',expected_label:'CURRENT SCORE',reversible_probes:[['a0','a0']],no_progress_probes:[['a4']]},
 best:{selector:'[data-best]',label_selector:'[data-best-label]',expected_label:'DEVICE BEST',source:'GameKit.best'},
 completion:{state_path:'state.outcome',success_value:'success',failure_value:'failure',result_selector:'[data-result]',success_text:'All panels complete',failure_text:'Panels incomplete',max_terminal_latency_ms:100,failure_wait_ms:15500,failure_actions:[]},
 replay:{selector:'[data-game-restart]',must_be_in_initial_mobile_viewport:true},
 difficulty:{deterministic_seeds:seeds,oracle_id:'fixture-switches-v1',oracle_sha256:hash(model()),projection,stage_path:'quality.stage',complexity_path:'quality.complexity',meaningful_actions_path:'quality.meaningful_actions',reversible_state_path:'quality.reversible_state_key',required_monotonicity:'later_strictly_greater',max_actions:64},
 mobile:{critical_selectors:['[data-objective]','[data-product-progress]','[data-score-label]','[data-game-score]','[data-best-label]','[data-best]','[data-result]'],control_selectors:['[data-game-start]','[data-game-pause]','[data-game-resume]','[data-game-restart]'],canvas_selector:'[data-game-canvas]',canvas_control_regions:Array.from({length:5},(_,i)=>({x:i*.2,y:.48,width:.2,height:.35})),min_font_px:12,min_hit_target_px:44},
 reduced_motion:{presentation_probe_path:'presentation.reduced_motion',dynamic_change_required:true},
 feedback:{action:'a0',state_change_path:'quality.reversible_state_key',visual_probe:'[data-game-canvas]',active_probe_path:'presentation.feedback_active',static_probe_path:'presentation.static_feedback',settle_ms:400},
 actions:Object.fromEntries(keys.map((key,i)=>['a'+i,{key,touch:{x:(i+.5)/5,y:.65},hold_ms:35,settle_ms:35}]))};}
function write(dir,variant='GOOD'){
 fs.mkdirSync(path.join(dir,'view'),{recursive:true});
 for(const name of ['core.js','app.js','style.css','index.html','README.md','view/art.js'])fs.copyFileSync(path.join(__dirname,name),path.join(dir,name));
 fs.writeFileSync(path.join(dir,'fixture.json'),JSON.stringify({variant}));
 fs.copyFileSync(path.join(__dirname,'../../../gamekit/gamekit.js'),path.join(dir,'gamekit.js'));
}
if(require.main===module){const dir=path.join(__dirname,'../../reviewed'),m=model();atomicJSON(path.join(dir,'fixture-switches-v1.json'),m);atomicJSON(path.join(dir,'registry.json'),{schema_version:1,entries:[{id:'fixture-switches-v1',file:'fixture-switches-v1.json',sha256:hash(m),scope:'fixture',contract_sha256:hash(contract()),reviewed_by:'Factory infrastructure fixture review',rationale:'Toggle truth table; target has 2, 3, 4 set bits; 3, 4, 5 consequential choices. Test-only approval cannot commission a public candidate.'}]});atomicJSON(path.join(__dirname,'contract.json'),contract());}
module.exports={contract,model,write,seeds};
