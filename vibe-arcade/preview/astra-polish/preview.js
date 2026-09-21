/* Owner playtest only. No network, analytics, account or production-record access. */
(function(){'use strict';
const q=new URLSearchParams(location.search),mode=q.get('feel')==='direct'?'direct':'responsive';
AstraMotion.setMode(mode);AstraPolish.setQuality(q.get('fx')==='low'?'low':'high');
const modeSelect=document.getElementById('feelSelect'),fx=document.getElementById('fxSelect');
modeSelect.value=mode;fx.value=AstraPolish.quality;
modeSelect.onchange=()=>{const u=new URL(location.href);u.searchParams.set('feel',modeSelect.value);location.replace(u.pathname+u.search);};
fx.onchange=()=>{AstraPolish.setQuality(fx.value);};
})();
