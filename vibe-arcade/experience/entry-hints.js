/* Intent-only entry. Never prefetches a page, starts a ranked run, or adds analytics. */
(function(){'use strict';let warmed=false;
const paths=new Set(['/descent','/games/core-pins','/games/nova-merge','/games/orbit-sprint']);
function target(e){const a=e.target?.closest?.('.game-card, a[data-next-game]');if(!a)return null;const u=new URL(a.href,location.href);if(u.origin!==location.origin||!paths.has(u.pathname.replace(/\/$/,'')))return null;return {a,u};}
function warm(e){const t=target(e),c=navigator.connection;if(!t||warmed||c?.saveData||/^(slow-2g|2g)$/.test(c?.effectiveType||''))return;
 if(t.u.pathname.includes('orbit-sprint'))return;warmed=true;const link=document.createElement('link');link.rel='prefetch';link.as='script';link.href='/vendor/phaser-3.90.0.min.js';document.head.append(link);}
function enter(e){const t=target(e);if(!t||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||t.a.hasAttribute('download')||t.a.target==='_blank'||t.a.getAttribute('aria-disabled')==='true')return;
 t.u.searchParams.set('play','1');t.a.href=t.u.pathname+t.u.search+t.u.hash;
}
document.addEventListener('pointerover',warm,{passive:true});document.addEventListener('focusin',warm);document.addEventListener('click',enter);
})();
