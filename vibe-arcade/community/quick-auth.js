/* Three-field Play ID entry. A new ID creates a real account, explicitly disclosed. */
(function(){'use strict';
const C=LoopCommunity,L=WorldLeague,$=q=>document.querySelector(q);
const host=document.createElement('div');host.id='quickAuth';
host.innerHTML=`<form id="quickForm" class="quick-form" autocomplete="on">
<h3>Pick your flag. Start playing.</h3><p class="note">No email or separate signup page. A new ID creates a play account; an existing ID signs in.</p>
<label for="playId">Play ID</label><input id="playId" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" minlength="4" maxlength="16" pattern="[A-Za-z0-9_]{4,16}" required placeholder="4–16 letters, numbers or _">
<label for="playPassword" id="playPasswordLabel">Password</label><input id="playPassword" name="password" type="password" autocomplete="current-password" maxlength="256" required aria-describedby="passwordHelp"><p id="passwordHelp" class="note">15–128 characters. A memorable phrase works; no special-symbol rules. Save it in your password manager.</p>
<label class="check"><input id="showPlayPassword" type="checkbox"><span>Show password</span></label>
<div id="quickCountryGroup"><label for="quickCountry">Your flag</label><select id="quickCountry" name="country"></select><p class="note">Choose a flag for a new ID. Signing in keeps your existing flag. Changes are limited to once every 30 days.</p>
<label class="check"><input id="quickConsent" type="checkbox"><span>For a new ID: I am 16 or older, have read the <a href="/community/privacy.html">Privacy Notice</a>, and agree my ID, flag and ranked scores will be public.</span></label></div>
<div id="recoveryInputGroup" hidden><label for="recoveryInput">Recovery code</label><input id="recoveryInput" type="password" autocomplete="off" spellcheck="false" placeholder="ljr_…"><p class="note">Use the code saved when you created your ID. It can be used only once.</p></div>
<button type="submit" id="quickContinue" class="btn primary">Continue</button><p id="quickStatus" class="status" role="status" aria-live="polite"></p>
<button id="quickRecover" type="button" class="text-link">Forgot password? Use recovery code</button>
<a id="quickGuest" class="text-link">Play free without ranking →</a></form>
<section id="recoveryResult" hidden aria-labelledby="recoveryTitle"><h3 id="recoveryTitle">Save your recovery code</h3><p class="note">No email is collected. Keep this code somewhere private. Without your password or this code, we cannot restore your account. A new code replaces the old one.</p><code id="recoveryCode" style="display:block;overflow-wrap:anywhere;user-select:all;margin:16px 0"></code><button type="button" id="copyRecovery" class="btn secondary">Copy recovery code</button><button type="button" id="finishQuick" class="btn primary">Continue to game →</button><p id="recoveryStatus" class="note" role="status"></p></section>`;
$('#login').insertAdjacentElement('beforebegin',host);
let recovering=false,busy=false,showingCode=false;
const next=L.safeReturn(new URLSearchParams(location.search).get('returnTo'));
$('#quickGuest').href=next||'/#games';
const select=$('#quickCountry');select.add(new Option('Select your country / region',''));
C.countries.map(code=>({code,name:C.countryName(code)})).sort((a,b)=>a.name.localeCompare(b.name)).forEach(c=>select.add(new Option(c.name+' ('+c.code+')',c.code)));
select.onchange=()=>C.selectionPreview(select);C.selectionPreview(select);
$('#showPlayPassword').onchange=()=>$('#playPassword').type=$('#showPlayPassword').checked?'text':'password';
function refresh(){host.hidden=C.authenticated&&!showingCode;$('#quickForm').hidden=C.authenticated;$('#recoveryResult').hidden=!showingCode;}
function announce(){document.dispatchEvent(new CustomEvent('loopjolt:auth-changed'));refresh();}
function finish(){showingCode=false;$('#recoveryCode').textContent='';announce();if(next)location.assign(next);}
$('#finishQuick').onclick=finish;
$('#copyRecovery').onclick=async()=>{try{await navigator.clipboard.writeText($('#recoveryCode').textContent);$('#recoveryStatus').textContent='Copied. Store it privately, then continue.';}catch{$('#recoveryStatus').textContent='Select the code and copy it manually.';}};
$('#quickRecover').onclick=()=>{if(busy)return;recovering=!recovering;$('#quickCountryGroup').hidden=recovering;$('#recoveryInputGroup').hidden=!recovering;$('#recoveryInput').required=recovering;$('#playPasswordLabel').textContent=recovering?'New password':'Password';$('#playPassword').autocomplete=recovering?'new-password':'current-password';$('#quickContinue').textContent=recovering?'Reset password & continue':'Continue';$('#quickRecover').textContent=recovering?'Back to ID & password':'Forgot password? Use recovery code';$('#quickStatus').textContent='';};
const messages={invalid_play_id:'Use 4–16 letters, numbers or underscores for your ID.',invalid_password:'Use a password or phrase of 15–128 characters.',weak_password:'That password is too easy to guess. Choose a different phrase.',invalid_country:'Choose your flag to create a new Play ID.',consent_required:'To create a new ID, confirm the age and public-profile notice.',invalid_credentials:'Unable to continue with these details. Check your password or recovery code. Existing Google players should continue with Google.',rate_limited:'Too many attempts. Wait 15 minutes before retrying. Free play still works.',play_id_unavailable:'Play ID entry is temporarily unavailable. Use Google or play free.',backend_unavailable:'Connection unavailable. Retry in a moment; free play still works.'};
$('#quickForm').onsubmit=async e=>{
 e.preventDefault();if(busy)return;const pass=$('#playPassword').value.normalize('NFC');if(Array.from(pass).length<15||Array.from(pass).length>128){$('#quickStatus').textContent=messages.invalid_password;return;}
 busy=true;$('#quickContinue').disabled=true;$('#quickStatus').textContent='Preparing your player card…';
 try{const result=await C.quickAuth({id:$('#playId').value,password:pass,country:select.value,consent:$('#quickConsent').checked,age16:$('#quickConsent').checked,...(recovering?{recoveryCode:$('#recoveryInput').value}:{})},recovering);
  $('#playPassword').value='';$('#recoveryInput').value='';$('#quickStatus').textContent='';
  if(result.recoveryCode){showingCode=true;$('#recoveryCode').textContent=result.recoveryCode;refresh();$('#finishQuick').focus();}
  else{announce();if(next)location.assign(next);}
 }catch(error){$('#quickStatus').textContent=messages[error.message]||'Could not continue. Please retry.';}
 finally{busy=false;$('#quickContinue').disabled=false;}
};
document.addEventListener('league:identity',refresh);
C.config().then(cfg=>{if(!cfg.playIdReady){$('#quickContinue').disabled=true;$('#quickStatus').textContent=messages.play_id_unavailable;}}).catch(()=>{});
window.LoopQuickAuth=Object.freeze({refresh});refresh();
})();
