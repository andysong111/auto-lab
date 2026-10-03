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
    let scene=null,latest=null,disposed=false,feedbackAge=Infinity,feedbackKey=null,feedbackActive=false,staticFeedback=false;
    let feedbackLayer=null,resultLayer=null,resultText=null,progressRail=null;
    const initialWidth=Math.max(1,Math.round(canvas.getBoundingClientRect().width||canvas.width||640));
    const initialHeight=Math.max(1,Math.round(canvas.getBoundingClientRect().height||canvas.height||480));
    const game=new Phaser.Game({
      // QA runs under a hardened custom browser environment. Phaser requires an explicit renderer there.
      type:Phaser.CANVAS,
      canvas,
      width:initialWidth,
      height:initialHeight,
      transparent:true,
      render:{antialias:true,roundPixels:false},
      physics:{default:'arcade',arcade:{debug:false}},
      scene:{
        create(){
          scene=this;
          if(!root.LoopJoltFeelFX?.create)throw Error('feel_fx_runtime_missing');
          scene.playjoltFeel=root.LoopJoltFeelFX.create(scene,{reduced:()=>!!latest?.presentation?.platform_reduced_motion,maxParticles:90,maxFloaters:5});
          visuals.create(this);
          if(scene.add?.graphics){
            feedbackLayer=scene.add.graphics().setDepth?.(100000)||null;
            resultLayer=scene.add.graphics().setDepth?.(100001)||null;
            progressRail=scene.add.graphics().setDepth?.(100002)||null;
          }
          if(scene.add?.text)resultText=scene.add.text(0,0,'',{fontFamily:'system-ui, sans-serif',fontStyle:'bold',align:'center',color:'#ffffff'}).setOrigin?.(.5)?.setDepth?.(100003)||null;
          if(latest)visuals.update(this,clone(latest));
        },
        update(_time,delta){
          scene?.playjoltFeel?.update(delta);
          if(feedbackAge!==Infinity){feedbackAge+=Math.max(0,Math.min(Number(delta)||0,100));feedbackActive=feedbackAge<450;staticFeedback=feedbackAge<650;}
          drawProtectedPresentation();
        }
      }
    });
    function clear(layer){try{layer?.clear?.();}catch{}}
    function drawProtectedPresentation(){
      if(!scene||!latest)return;
      const width=Math.max(1,Number(game.scale?.width)||canvas.width||640),height=Math.max(1,Number(game.scale?.height)||canvas.height||480);
      clear(feedbackLayer);clear(resultLayer);clear(progressRail);
      const reduced=!!latest.presentation?.platform_reduced_motion;
      if(feedbackLayer&&staticFeedback){
        const t=reduced?1:Math.min(1,feedbackAge/450),radius=Math.max(18,Math.min(width,height)*(.07+.12*t)),alpha=reduced?.78:Math.max(.12,.8*(1-t));
        feedbackLayer.lineStyle?.(Math.max(3,Math.round(Math.min(width,height)*.009)),0x7fffd4,alpha);
        feedbackLayer.strokeCircle?.(width*.5,height*.42,radius);
        feedbackLayer.fillStyle?.(0xffffff,Math.max(.04,alpha*.18));feedbackLayer.fillCircle?.(width*.5,height*.42,Math.max(6,radius*.28));
      }
      if(progressRail){
        const progress=Math.max(0,Math.min(3,Number(latest.progress)||0));
        progressRail.fillStyle?.(0x09141f,.72);progressRail.fillRoundedRect?.(width*.16,height*.045,width*.68,Math.max(8,height*.018),5);
        progressRail.fillStyle?.(0x4ee8a3,.95);progressRail.fillRoundedRect?.(width*.16,height*.045,width*.68*(progress/3),Math.max(8,height*.018),5);
      }
      const outcome=latest.state?.outcome,terminal=outcome==='success'||outcome==='failure';
      if(resultLayer&&terminal){
        const success=outcome==='success',y=height*.79,h=height*.21;
        resultLayer.fillStyle?.(success?0x083d2d:0x4a1420,.9);resultLayer.fillRect?.(0,y,width,h);
        resultLayer.lineStyle?.(Math.max(3,height*.008),success?0x67f5bd:0xff7791,1);resultLayer.strokeRect?.(0,y,width,h);
      }
      if(resultText){
        const completion=latest.metadata?.product_contract?.completion;
        resultText.setText?.(terminal?(outcome==='success'?completion?.success_text:completion?.failure_text)||outcome.toUpperCase():'');
        resultText.setPosition?.(width*.5,height*.89);resultText.setFontSize?.(Math.max(20,Math.min(42,width*.065)));resultText.setVisible?.(terminal);
      }
    }
    function render(snapshot){
      if(disposed)return;
      const nextKey=snapshot?.quality?.reversible_state_key;
      if(feedbackKey!==null&&nextKey!==undefined&&nextKey!==feedbackKey){feedbackAge=0;feedbackActive=true;staticFeedback=true;}
      if(nextKey!==undefined)feedbackKey=nextKey;
      latest=clone(snapshot);
      if(scene){visuals.update(scene,clone(latest));drawProtectedPresentation();}
    }
    function resize(width,height){
      if(disposed)return;
      width=Math.max(1,Math.round(width));height=Math.max(1,Math.round(height));
      if(game.scale?.resize)game.scale.resize(width,height);
    }
    function dispose(){
      if(disposed)return;
      scene?.playjoltFeel?.destroy();
      disposed=true;scene=null;latest=null;
      game.destroy(true);
    }
    function presentation(){return {feedback_active:feedbackActive,static_feedback:staticFeedback,protected_result:latest?.state?.outcome==='success'||latest?.state?.outcome==='failure'};}
    return Object.freeze({render,resize,dispose,presentation,kind:'phaser4',version:PHASER_VERSION});
  }
  root.PlayJoltPhaserKit=Object.freeze({create,version:'phaserkit-3',phaser:PHASER_VERSION});
  if(typeof module!=='undefined')module.exports=root.PlayJoltPhaserKit;
})(globalThis);
