(function(root){
  'use strict';
  function create(scene){
    const bg=scene.add.rectangle(0,0,16,16,0x0d1724).setOrigin(0,0);
    const orb=scene.add.circle(0,0,20,0x70e8c8);
    const bar=scene.add.rectangle(0,0,10,8,0x70e8c8).setOrigin(0,0);
    root.__phaserFixture={scene,bg,orb,bar};
  }
  function render(scene,snapshot,size){
    const f=root.__phaserFixture;if(!f||f.scene!==scene)return;
    const s=snapshot.state,w=size.width,h=size.height;
    f.bg.setPosition(0,0).setSize(w,h);
    f.orb.setPosition(w*(.08+s.x*.84),h*.55).setRadius(Math.max(10,w*.035));
    f.bar.setPosition(w*.1,h*.86).setSize(w*.8*Math.min(1,s.tick/600),Math.max(6,h*.015));
  }
  function resize(scene,size){scene.cameras?.main?.setSize?.(size.width,size.height);}
  function destroy(){delete root.__phaserFixture;}
  root.FactoryPhaserScene={create,render,resize,destroy};
})(globalThis);
