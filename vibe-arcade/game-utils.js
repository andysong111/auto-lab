(function(){
  let audioCtx=null;
  function audio(){
    if(!audioCtx){
      const C=window.AudioContext||window.webkitAudioContext;
      if(C) audioCtx=new C();
    }
    if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
    return audioCtx;
  }
  function tone(freq=440,duration=.08,type='sine',gain=.035,delay=0){
    const ctx=audio(); if(!ctx) return;
    const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;
    o.type=type;o.frequency.setValueAtTime(freq,t);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+duration+.02);
  }
  function sound(kind){
    if(kind==='tap'){tone(520,.055,'triangle',.025)}
    if(kind==='hit'){tone(690,.055,'sine',.03);tone(980,.04,'triangle',.015,.02)}
    if(kind==='good'){tone(620,.07,'sine',.035);tone(830,.08,'sine',.03,.06);tone(1040,.1,'sine',.025,.12)}
    if(kind==='bad'){tone(170,.11,'sawtooth',.028);tone(120,.15,'square',.018,.07)}
    if(kind==='perfect'){tone(740,.06,'triangle',.035);tone(1110,.07,'sine',.03,.05);tone(1480,.1,'sine',.025,.11)}
  }
  function haptic(ms=16){try{navigator.vibrate?.(ms)}catch(e){}}
  function burstAt(x,y,count=16,colors=['#fff','#8f8cff','#73f6b5','#ff5268']){
    const frag=document.createDocumentFragment();
    for(let i=0;i<count;i++){
      const p=document.createElement('i');p.className='fx-particle';
      const a=Math.random()*Math.PI*2,d=35+Math.random()*95;
      p.style.left=x+'px';p.style.top=y+'px';p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d+'px');p.style.setProperty('--r',(Math.random()*540-270)+'deg');p.style.setProperty('--c',colors[i%colors.length]);
      frag.appendChild(p);setTimeout(()=>p.remove(),800);
    }
    document.body.appendChild(frag);
  }
  function burstElement(el,count){
    const r=el.getBoundingClientRect();burstAt(r.left+r.width/2,r.top+r.height/2,count);
  }
  function toast(text){
    document.querySelector('.toast')?.remove();
    const n=document.createElement('div');n.className='toast';n.textContent=text;document.body.appendChild(n);setTimeout(()=>n.remove(),1650);
  }
  function localBest(key,value,mode='max'){
    const prev=Number(localStorage.getItem('loopjolt_best_'+key)||0);
    const next=mode==='min'?(prev===0?value:Math.min(prev,value)):Math.max(prev,value);
    if(Number.isFinite(value)&&next!==prev)localStorage.setItem('loopjolt_best_'+key,String(next));
    return next;
  }
  window.LoopJolt={tone,sound,haptic,burstAt,burstElement,toast,localBest};
})();