/* Factory-owned Phaser 4 rendering bridge for new PlayJolt candidates.
 * Canonical game state remains in GameKit/core.js. Phaser owns presentation only. */
(function (root) {
  'use strict';
  const PHASER_VERSION = '4.2.1';
  const VERSION = 'phaserkit-1';
  const FINAL_KEYS = ['x','y','alpha','angle','rotation','scale','scaleX','scaleY'];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function tweenFinal(target,config) {
    for (const key of FINAL_KEYS) {
      let value=config[key];
      if (value && typeof value==='object' && Number.isFinite(value.to)) value=value.to;
      if (!Number.isFinite(value)) continue;
      if (key==='scale' && typeof target.setScale==='function') target.setScale(value);
      else target[key]=value;
    }
  }
  function create({canvas, art, metadata}) {
    if (!root.Phaser || root.Phaser.VERSION !== PHASER_VERSION) throw Error('phaser_runtime_mismatch');
    if (!canvas || !art || typeof art.create!=='function' || typeof art.sync!=='function') throw Error('phaser_art_contract');
    let scene=null,game=null,ready=false,destroyed=false,latest=null,lastSize={width:640,height:480},feedbackUntil=0,staticFeedback=false;
    const state=Object.create(null);
    const api={
      version:VERSION,
      phaser_version:PHASER_VERSION,
      state,
      snapshot:()=>latest,
      reducedMotion:()=>typeof root.matchMedia==='function'?root.matchMedia('(prefers-reduced-motion: reduce)').matches:!!latest?.presentation?.platform_reduced_motion,
      markFeedback({duration=420,static_only=false}={}) {
        feedbackUntil=Math.max(feedbackUntil,performance.now()+clamp(Number(duration)||0,100,1200));
        staticFeedback=!!static_only||api.reducedMotion();
      },
      tween(target,config={}) {
        if(!scene||!target)return null;
        scene.tweens.killTweensOf(target);
        if(api.reducedMotion()){
          tweenFinal(target,config);api.markFeedback({duration:config.duration||300,static_only:true});
          config.onComplete?.();return null;
        }
        api.markFeedback({duration:(config.duration||300)+80});
        return scene.tweens.add({...config,targets:target});
      },
      pulse(target,{scale=1.08,duration=180}={}) {
        if(!target)return null;
        const baseX=Number(target.scaleX)||1,baseY=Number(target.scaleY)||1;
        if(api.reducedMotion()){target.setScale?.(baseX*scale,baseY*scale);api.markFeedback({duration,static_only:true});return null;}
        api.markFeedback({duration:duration*2});
        return scene.tweens.chain({targets:target,tweens:[
          {scaleX:baseX*scale,scaleY:baseY*scale,duration, ease:'Sine.Out'},
          {scaleX:baseX,scaleY:baseY,duration, ease:'Sine.In'}
        ]});
      },
      shake({duration=180,intensity=.006}={}) {
        api.markFeedback({duration,static_only:api.reducedMotion()});
        if(!api.reducedMotion())scene?.cameras?.main?.shake(clamp(duration,50,600),clamp(intensity,0,.03));
      },
      setVisible(target,value){if(target?.setVisible)target.setVisible(!!value);else if(target)target.visible=!!value;return target;},
      size:()=>({...lastSize})
    };
    const config={
      type:root.Phaser.AUTO,
      width:lastSize.width,height:lastSize.height,
      canvas,
      transparent:false,
      backgroundColor:'#080f1a',
      render:{antialias:true,pixelArt:false,roundPixels:false},
      scene:{
        create(){
          scene=this;ready=true;
          art.create(scene,api);
          if(latest)art.sync(scene,latest,api);
        }
      }
    };
    game=new root.Phaser.Game(config);
    function resize(width,height){
      if(destroyed)return;
      width=Math.max(1,Math.round(width));height=Math.max(1,Math.round(height));if(width===lastSize.width&&height===lastSize.height)return;lastSize={width,height};
      if(game?.scale?.resize)game.scale.resize(width,height);
      if(scene?.cameras?.main?.setSize)scene.cameras.main.setSize(width,height);
      art.resize?.(scene,{width,height},api);
    }
    function render(snapshot,size){
      if(destroyed)return;
      latest=snapshot;if(size)resize(size.width,size.height);
      if(ready)art.sync(scene,snapshot,api);
    }
    function presentation(){
      const custom=ready&&typeof art.presentation==='function'?(art.presentation(scene,latest,api)||{}):{};
      const active=performance.now()<feedbackUntil;
      return {...custom,reduced_motion:api.reducedMotion(),feedback_active:custom.feedback_active??active,
        static_feedback:custom.static_feedback??(active&&staticFeedback)};
    }
    function dispose(){
      if(destroyed)return;destroyed=true;
      try{art.destroy?.(scene,api);}catch{}
      try{game?.destroy(true);}catch{}
      scene=null;game=null;
    }
    return Object.freeze({render,resize,presentation,dispose,version:VERSION,phaser_version:PHASER_VERSION});
  }
  root.PlayJoltPhaserKit=Object.freeze({create,version:VERSION,phaser_version:PHASER_VERSION});
  if(typeof module!=='undefined')module.exports=root.PlayJoltPhaserKit;
})(globalThis);
