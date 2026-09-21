/* Exact-route dispatcher. Other challengers retain their original controller. */
(function(){'use strict';
 const selected=document.body.dataset.game||new URLSearchParams(location.search).get('game'),pins=selected==='core-pins';
 if(['core-pins','nova-merge'].includes(selected)){let c=document.querySelector('link[rel=canonical]');if(!c){c=document.createElement('link');c.rel='canonical';document.head.append(c);}c.href='https://vibe-arcade-dun.vercel.app/games/'+selected;}
 const scripts=pins?['/core-pins/bundle.js']:['/challengers/game.js'];
 if(pins){const css=document.createElement('link');css.rel='stylesheet';css.href='/core-pins/style.css';document.head.append(css);}
 const primary=document.querySelector('#primary'),ranked=document.querySelector('#ranked');
 primary.disabled=true;ranked.disabled=true;
 function failed(){document.querySelector('#status').textContent='Game files could not load. Reload to try again.';primary.textContent='Reload game';primary.disabled=false;primary.onclick=()=>location.reload();}
 function next(i){if(i===scripts.length)return;const s=document.createElement('script');s.src=scripts[i];s.async=false;s.onload=()=>next(i+1);s.onerror=failed;document.body.append(s);}
 next(0);
})();
