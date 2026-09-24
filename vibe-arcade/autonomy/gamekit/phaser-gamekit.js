/* Factory-owned Phaser 4 visual adapter. Canonical gameplay state remains in PlayJoltGameKit/core.js. */
(function(root){
  'use strict';
  function createRenderer({canvas,sceneHooks}){
    if(!root.Phaser||typeof root.Phaser.Game!=='function')throw Error('phaser_runtime_missing');
    if(!sceneHooks||typeof sceneHooks.render!=='function')throw Error('phaser_scene_hooks_missing');
    let scene=null,game=null,pending=null,lastSize={width:Math.max(1,canvas.width||1),height:Math.max(1,canvas.height||1)};
    const config={
      type:root.Phaser.AUTO,
      canvas,
      width:lastSize.width,
      height:lastSize.height,
      transparent:true,
      backgroundColor:'#000000',
      banner:false,
      scene:{
        create(){
          scene=this;
          sceneHooks.create?.(scene,{runtime:'phaser4',version:root.Phaser.VERSION||'unknown'});
          if(pending){sceneHooks.render(scene,pending.snapshot,pending.size);pending=null;}
        }
      }
    };
    game=new root.Phaser.Game(config);
    return Object.freeze({
      render(snapshot,size){
        lastSize=size;
        if(!scene){pending={snapshot,size};return;}
        sceneHooks.render(scene,snapshot,size);
      },
      resize(size){
        lastSize=size;
        if(game?.scale?.resize)game.scale.resize(size.width,size.height);
        sceneHooks.resize?.(scene,size);
      },
      destroy(){
        try{sceneHooks.destroy?.(scene);}finally{if(game?.destroy)game.destroy(true);}
        scene=null;game=null;pending=null;
      }
    });
  }
  function create({core,sceneHooks,canvas,metadata,rankedAdapter=null,seed,capture,qa,presentation=()=>({})}){
    if(!root.PlayJoltGameKit)throw Error('gamekit_missing');
    const renderer=createRenderer({canvas,sceneHooks});
    return root.PlayJoltGameKit.create({core,renderer,canvas,metadata,rankedAdapter,seed,capture,qa,presentation});
  }
  root.PlayJoltPhaserKit=Object.freeze({create,createRenderer,version:'phaser-gamekit-1'});
  if(typeof module!=='undefined')module.exports=root.PlayJoltPhaserKit;
})(globalThis);
