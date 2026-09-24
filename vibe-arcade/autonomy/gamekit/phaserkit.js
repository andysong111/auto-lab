/* Factory-owned Phaser 4 visual bridge.
 * Canonical gameplay state remains in PlayJoltGameKit/core.js.
 * Phaser is presentation-only: no candidate-owned simulation clock or outcome authority. */
(function(root){
  'use strict';
  const PHASER_VERSION='4.2.1';
  const clone=x=>JSON.parse(JSON.stringify(x));
  function create({canvas,visuals}){
    const Phaser=root.Phaser;
    if(!Phaser||typeof Phaser.Game!=='function')throw Error('phaser_runtime_missing');
    if(String(Phaser.VERSION||'')!==PHASER_VERSION)throw Error('phaser_runtime_version_mismatch');
    if(!canvas||!visuals||typeof visuals.create!=='function'||typeof visuals.update!=='function')throw Error('phaser_visual_contract');
    let scene=null,latest=null,disposed=false;
    const initialWidth=Math.max(1,Math.round(canvas.getBoundingClientRect().width||canvas.width||640));
    const initialHeight=Math.max(1,Math.round(canvas.getBoundingClientRect().height||canvas.height||480));
    const game=new Phaser.Game({
      // QA runs under a hardened custom browser environment. Phaser requires an explicit renderer there.\n      type:Phaser.CANVAS,
      canvas,
      width:initialWidth,
      height:initialHeight,
      transparent:true,
      render:{antialias:true,roundPixels:false},
      physics:{default:'arcade',arcade:{debug:false}},
      scene:{
        create(){
          scene=this;
          visuals.create(this);
          if(latest)visuals.update(this,clone(latest));
        }
      }
    });
    function render(snapshot){
      if(disposed)return;
      latest=clone(snapshot);
      if(scene)visuals.update(scene,clone(latest));
    }
    function resize(width,height){
      if(disposed)return;
      width=Math.max(1,Math.round(width));height=Math.max(1,Math.round(height));
      if(game.scale?.resize)game.scale.resize(width,height);
    }
    function dispose(){
      if(disposed)return;
      disposed=true;scene=null;latest=null;
      game.destroy(true);
    }
    return Object.freeze({render,resize,dispose,kind:'phaser4',version:PHASER_VERSION});
  }
  root.PlayJoltPhaserKit=Object.freeze({create,version:'phaserkit-1',phaser:PHASER_VERSION});
  if(typeof module!=='undefined')module.exports=root.PlayJoltPhaserKit;
})(globalThis);
