/* Exact-route dispatcher. Other challengers retain their original controller. */
(function(){'use strict';
 const pins=new URLSearchParams(location.search).get('game')==='core-pins';
 const scripts=pins?['/core-pins/bundle.js']:['/challengers/game.js'];
 if(pins){const css=document.createElement('link');css.rel='stylesheet';css.href='/core-pins/style.css';document.head.append(css);}
 const primary=document.querySelector('#primary'),ranked=document.querySelector('#ranked');
 primary.disabled=true;ranked.disabled=true;
 function failed(){document.querySelector('#status').textContent='Game files could not load. Reload to try again.';primary.textContent='Reload game';primary.disabled=false;primary.onclick=()=>location.reload();}
 function next(i){if(i===scripts.length){if(!pins)primary.disabled=false;return;}const s=document.createElement('script');s.src=scripts[i];s.async=false;s.onload=()=>next(i+1);s.onerror=failed;document.body.append(s);}
 next(0);
})();
