(function(root) {
  'use strict';
  const state=new WeakMap();
  const visuals={
    create(scene){
      const graphics=scene.add.graphics();
      const label=scene.add.text(0,0,'',{fontFamily:'system-ui',fontSize:'18px',color:'#91a6c1'}).setOrigin(.5);
      state.set(scene,{graphics,label});
    },
    update(scene,snapshot){
      const v=state.get(scene);if(!v)return;
      const w=scene.scale.width,h=scene.scale.height,s=snapshot.state,g=v.graphics;
      g.clear();g.fillStyle(0x0d1724,1);g.fillRect(0,0,w,h);
      g.lineStyle(1,0x28405b,1);for(let x=0;x<w;x+=w/8){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.strokePath();}
      g.fillStyle(0x70e8c8,1);g.fillCircle(w*(.08+s.x*.84),h*.55,w*.035);
      g.fillRect(w*.1,h*.86,w*.8*Math.min(1,s.tick/600),h*.015);
      v.label.setPosition(w/2,h*.2).setText(snapshot.phase==='finished'?'RUN COMPLETE':'MOVE · TAP · REPEAT');
    }
  };
  root.GameVisuals=visuals;
  root.GamePresentation=()=>({reduced_motion:false,feedback_active:false,static_feedback:true});
})(globalThis);
