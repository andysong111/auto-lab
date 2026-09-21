(function(root) {
  'use strict';
  function draw(c, snapshot, size) {
    const {width:w, height:h} = size, s = snapshot.state;
    c.fillStyle = '#0d1724'; c.fillRect(0,0,w,h);
    c.strokeStyle = '#28405b'; c.lineWidth = 1;
    for (let x=0;x<w;x+=w/8) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,h); c.stroke(); }
    c.fillStyle = '#70e8c8'; c.beginPath(); c.arc(w*(.08+s.x*.84),h*.55,w*.035,0,Math.PI*2); c.fill();
    c.fillStyle = '#91a6c1'; c.font = `${Math.max(14,w*.035)}px system-ui`; c.textAlign='center';
    c.fillText(snapshot.phase === 'finished' ? 'RUN COMPLETE' : 'MOVE · TAP · REPEAT',w/2,h*.2);
    c.fillStyle='#70e8c8'; c.fillRect(w*.1,h*.86,w*.8*Math.min(1,s.tick/600),h*.015);
  }
  root.FactoryFixtureArt = {draw};
})(globalThis);
