(function(root){'use strict';
let refs=null,lastTap=-1;
function create(scene,api){
  const bg=scene.add.rectangle(0,0,10,10,0x0d1724).setOrigin(0);
  const grid=scene.add.graphics();
  const runner=scene.add.circle(0,0,18,0x70e8c8);
  const title=scene.add.text(0,0,'PHASER 4 · FACTORY',{fontFamily:'system-ui',fontSize:'18px',color:'#91a6c1'}).setOrigin(.5);
  const barBg=scene.add.rectangle(0,0,10,8,0x20354d).setOrigin(0,.5);
  const bar=scene.add.rectangle(0,0,10,8,0x70e8c8).setOrigin(0,.5);
  refs={bg,grid,runner,title,barBg,bar};
}
function sync(scene,snapshot,api){
  if(!refs)return;const {width:w,height:h}=api.size(),s=snapshot.state;
  refs.bg.setSize(w,h);refs.bg.setPosition(0,0);
  refs.grid.clear().lineStyle(1,0x28405b,.8);
  for(let i=1;i<8;i++){refs.grid.lineBetween(w*i/8,0,w*i/8,h);refs.grid.lineBetween(0,h*i/8,w,h*i/8);}
  refs.runner.setPosition(w*(.08+s.x*.84),h*.56).setRadius(Math.max(14,Math.min(w,h)*.035));
  refs.title.setPosition(w/2,h*.18).setText(snapshot.phase==='finished'?'RUN COMPLETE':'PHASER 4 · MOVE · TAP');
  refs.barBg.setPosition(w*.1,h*.86).setSize(w*.8,8);
  refs.bar.setPosition(w*.1,h*.86).setSize(w*.8*Math.min(1,s.tick/600),8);
  if(s.taps!==lastTap){if(lastTap>=0)api.pulse(refs.runner,{scale:1.15,duration:90});lastTap=s.taps;}
}
function presentation(scene,snapshot,api){return {fixture_renderer:'phaser4',reduced_motion:api.reducedMotion()};}
root.PhaserFixtureArt={create,sync,presentation};
})(globalThis);
