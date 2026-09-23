'use strict';
// Infrastructure only: no commissioning candidate or model-generated game.
const fs=require('node:fs'),path=require('node:path');
const {hash,atomicJSON}=require('../../../orchestrator/files.cjs');
const product=require('../../fixtures/product/contract.json');
const region=(x,y,width,height)=>({selector:'[data-game-canvas]',x,y,width,height});
const anchor=(node,r)=>({node,region:r});
function contract(){return {schema_version:1,review_id:'commercial-fixture-v1',seed:7,
 visual_legibility:{pairs:[{id:'enabled-disabled',kind:'action_availability',a:anchor('1:0',region(.025,.49,.15,.23)),b:anchor('1:0',region(.825,.49,.15,.23)),action_a:'a0',action_b:'a4',marker:'Enabled switch is filled; blocked switch has a contrasting diagonal cross.'}]},
 state_distinction:{pairs:[{id:'owned-unowned',kind:'state',a:anchor('1:0',region(.025,.49,.15,.23)),b:anchor('1:1',region(.025,.49,.15,.23)),state_path:'state.mask',marker:'Collected activation uses a bright cyan filled center, distinct from the unowned center.'}]},
 action_feedback:{probes:[{id:'primary',node:'1:0',action:'a0',kind:'movement',region:region(0,.46,.22,.32)},{id:'progress',node:'1:1',action:'a2',kind:'progress',region:region(0,.02,1,.42)}]},
 motion:{intermediate_ms:[60,130],settle_ms:450},
 progression_spectacle:{checkpoints:[1,2,3].map(s=>anchor(s+':0',region(0,.02,1,.4))),marker:'World bands change hue and geometric constellation grows in count and radius, excluding stage numbers.'},
 result_presentation:{region:region(0,.82,1,.18),success_title:'All panels complete',failure_title:'Panels incomplete'},
 audio:{mode:'required',mute_selector:'[data-mute]',primary_probe:'primary',progress_probe:'progress'},
 mobile_hierarchy:{gameplay_selector:'[data-game-canvas]',roles:[{role:'player',foreground:region(.03,.5,.14,.20),background:region(.03,.75,.14,.06)},{role:'goal',foreground:region(.036,.336,.08,.05),background:region(.03,.26,.14,.06)}]},
 replay_motivation:{selector:'[data-replay-reason]',reason:'Find a cleaner sequence and finish all panels; fixture demonstrates visible replay guidance only.'},performance:{sample_ms:1100}};}
const variants=['COMMERCIAL_GOOD','BAD_INVISIBLE_TOPOLOGY','BAD_TELEPORT','BAD_FLAT_PROGRESSION','BAD_RESULT','BAD_HIERARCHY','BAD_AUDIO','BAD_MOBILE_DENSITY','MULTI_COMMERCIAL_BAD'];
function write(dir,variant='COMMERCIAL_GOOD'){
 if(!variants.includes(variant))throw Error('fixture variant');fs.mkdirSync(path.join(dir,'view'),{recursive:true});
 for(const name of ['app.js','style.css','index.html','view/art.js'])fs.copyFileSync(path.join(__dirname,name),path.join(dir,name));
 fs.copyFileSync(path.join(__dirname,'../../fixtures/product/core.js'),path.join(dir,'core.js'));
 fs.copyFileSync(path.join(__dirname,'../../../gamekit/gamekit.js'),path.join(dir,'gamekit.js'));
 fs.writeFileSync(path.join(dir,'README.md'),'Commercial Gate infrastructure fixture. Not a game candidate.\n');atomicJSON(path.join(dir,'fixture.json'),{variant});
}
if(require.main===module){atomicJSON(path.join(__dirname,'contract.json'),contract());atomicJSON(path.join(__dirname,'../reviewed/registry.json'),{schema_version:1,entries:[{id:'commercial-fixture-v1',scope:'fixture',contract_sha256:hash(contract()),product_contract_sha256:hash(product),reviewed_by:'Work trusted fixture review',rationale:'Authored switch oracle: legal a0 vs disabled a4; mask state pair; three increasing stages; local non-text regions and movement/progress probes. All core fixture decisions covered; fixture-only, never candidate approval.'}]});}
module.exports={contract,product,write,variants};
