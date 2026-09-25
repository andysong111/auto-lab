'use strict';
const fs=require('node:fs'),path=require('node:path');

function arg(name){const i=process.argv.indexOf('--'+name);return i>=0?process.argv[i+1]:null;}
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function buildDefinition({date,sequence}){
  if(!/^\d{8}$/.test(date))throw Error('date must be YYYYMMDD');
  if(!Number.isInteger(sequence)||sequence<1)throw Error('sequence must be positive integer');
  const serial=String(200+(sequence%999700));
  const seedBase=1000+(sequence%90000)*10;
  const seeds=[0,1,2,3,4,5].map(i=>seedBase+i);
  if(sequence%2===0){
    const a=['Signal','Ember','Prism','Nova','Vector','Aurora','Ion','Echo'];
    const b=['Spires','Pylons','Towers','Beacons','Forges','Columns','Relays','Crowns'];
    const title=a[sequence%a.length]+' '+b[Math.floor(sequence/a.length)%b.length];
    return {schema:'playjolt-trusted-candidate/1',game_id:'GAME-'+date+'-'+serial,sequence,family:'binary-pylon',title,slug:norm(title),mechanic_family:'seeded-binary-pylon-tuning',seeds,objective:'Tune 3 signal tiers. Ignite the crown.',success_text:'CROWN IGNITED',failure_text:'SIGNAL COOLED',visual_theme:'dark signal forge of luminous pylons, target ghosts and a central crown core'};
  }
  const a=['Glyph','Relic','Rune','Cipher','Token','Sigil','Arc','Lattice'];
  const b=['Order','Archive','Sequence','Line','Deck','Chain','Array','Index'];
  const title=a[sequence%a.length]+' '+b[Math.floor(sequence/a.length)%b.length];
  return {schema:'playjolt-trusted-candidate/1',game_id:'GAME-'+date+'-'+serial,sequence,family:'adjacent-order',title,slug:norm(title),mechanic_family:'seeded-adjacent-order-reconstruction',seeds,objective:'Rebuild 3 glyph rows. Seal the Archive.',success_text:'ARCHIVE SEALED',failure_text:'ORDER FRACTURED',visual_theme:'dark kinetic archive of large glyph plates, target strips and mechanical seal bands'};
}
function writeCandidate(out,def){
  fs.mkdirSync(out,{recursive:true});
  const request={game_id:def.game_id,candidate:def.title,runtime:'Phaser 4.2.1 + GameKit v2',paid_calls:false,auto_commission:true,authorized_provider_calls:6,estimated_usd_ceiling:2,production_authorized:false,request_revision:1,generated_by:'trusted-autonomous-intake-v2'};
  fs.writeFileSync(path.join(out,'candidate.json'),JSON.stringify(def,null,2)+'\n');
  fs.writeFileSync(path.join(out,'preflight-request.json'),JSON.stringify(request,null,2)+'\n');
  fs.writeFileSync(path.join(out,'commission.cjs'),"'use strict';\nrequire('../../cycle/commission.cjs').main().catch(e=>{console.error(e.stack);process.exitCode=1;});\n");
  return request;
}
if(require.main===module){
  const date=arg('date'),sequence=Number(arg('sequence')),out=arg('out');
  if(!out)throw Error('--out required');
  const def=buildDefinition({date,sequence}),request=writeCandidate(path.resolve(out),def);
  console.log(JSON.stringify({definition:def,request},null,2));
}
module.exports={buildDefinition,writeCandidate,norm};
