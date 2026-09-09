function installStateIntegrity(w,d){
 if(d.getElementById('mvp16StateIntegrity'))return true;
 const patch=d.createElement('script');
 patch.id='mvp16StateIntegrity';
 patch.textContent=`
(function(){
 const STATE_VERSION='1.6';
 function num(v){return Math.max(0,Number(String(v??'').replace(/[$,\\s]/g,''))||0)}
 function configured(x){
   if(!x||typeof x!=='object')return false;
   const life=x.life||{};
   return num(x.paycheck)>0||!!x.nextPayday||(Array.isArray(x.bills)&&x.bills.length>0)||num(x.checking)>0||num(x.cash)>0||num(x.savings)>0||num(life.food)+num(life.gas)+num(life.other)>0||num(x.everydayInput?.amount)>0||num(x.savePerPaycheck)>0||!!x.goalName;
 }
 function normalized(x){
   x=x&&typeof x==='object'?x:{};
   x.bills=Array.isArray(x.bills)?x.bills:[];
   x.life=x.life&&typeof x.life==='object'?x.life:{food:0,gas:0,other:0};
   x.everydayInput=x.everydayInput&&typeof x.everydayInput==='object'?x.everydayInput:{amount:num(x.life.food)+num(x.life.gas)+num(x.life.other),basis:'paycheck'};
   x.payDays=Array.isArray(x.payDays)&&x.payDays.length===2?x.payDays:['15','last'];
   x.s2sActivity=Array.isArray(x.s2sActivity)?x.s2sActivity.slice(0,50):[];
   x.prePaydayAdjustments=Array.isArray(x.prePaydayAdjustments)?x.prePaydayAdjustments.slice(0,50):[];
   if(x.s2sBalance===undefined)x.s2sBalance=null;
   if(x.s2sAnchor===undefined)x.s2sAnchor=null;
   x.stateVersion=STATE_VERSION;
   return x;
 }
 function saveState(reason){
   P=normalized(P);
   if(configured(P)){
     P.onboardingComplete=!!P.onboardingComplete||document.getElementById('onboard')?.classList.contains('hide');
     localStorage.setItem(KEY,JSON.stringify(P));
   }
   validateState(reason||'save');
 }
 function hydrateCanonical(){
   let raw=localStorage.getItem(KEY),stored=null;
   if(!raw)return false;
   try{stored=normalized(JSON.parse(raw))}catch(e){console.error('[S2S QA][STATE_PARSE]',e);localStorage.removeItem(KEY);return false}
   if(!configured(stored)){
     console.warn('[S2S QA][EMPTY_STATE_RECOVERED] Removed an invalid empty persisted state.');
     localStorage.removeItem(KEY);
     const ob=document.getElementById('onboard');if(ob)ob.classList.remove('hide');
     return false;
   }
   P=Object.assign(P,stored);
   P=normalized(P);
   localStorage.setItem(KEY,JSON.stringify(P));
   return true;
 }
 function validateState(reason){
   try{
     const errors=[];
     const avail=typeof currentAvailable==='function'?currentAvailable():num(P.checking)+num(P.cash);
     const safe=num(P.s2sBalance);
     const accounted=typeof currentAccounted==='function'?currentAccounted():Math.max(0,avail-safe);
     if(Math.abs((accounted+safe)-avail)>.51)errors.push('Available Balance != Accounted For + Safe2Spend');
     if(safe>avail+.51)errors.push('Safe2Spend exceeds Available Balance');
     if(Array.isArray(P.s2sActivity)&&P.s2sActivity.length>50)errors.push('Activity history exceeded cap');
     if(Array.isArray(P.prePaydayAdjustments)&&P.prePaydayAdjustments.length>50)errors.push('Pre-payday adjustments exceeded cap');
     const saved=localStorage.getItem(KEY);if(saved){try{const persisted=JSON.parse(saved);if(num(persisted.savings)!==num(P.savings))errors.push('Persisted savings != runtime savings')}catch(e){errors.push('Persisted state is not valid JSON')}}
     if(errors.length)console.error('[S2S QA][INVARIANT]['+(reason||'runtime')+']',errors,{avail,accounted,safe,savings:num(P.savings)});
     else console.info('[S2S QA][PASS]['+(reason||'runtime')+']',{avail,accounted,safe,savings:num(P.savings)});
     return errors;
   }catch(e){console.error('[S2S QA][VALIDATOR]',e);return ['validator failure']}
 }
 function patchAhaCopy(){
   const hero=document.querySelector('.aha-hero');if(!hero)return;
   const safeEl=document.getElementById('ahaSafe'),heroSub=document.getElementById('ahaHeroSub'),pills=document.getElementById('ahaPills');
   const kicker=hero.querySelector('.kicker');if(kicker)kicker.textContent='PROJECTED FROM YOUR NEXT PAYCHECK';
   const name=hero.querySelector('.aha-hero-name');if(name)name.textContent='Projected Safe2Spend';
   if(heroSub)heroSub.textContent='What your next paycheck is projected to leave after bills, everyday spending, and your savings plan are accounted for.';
   if(pills)pills.innerHTML='<span class="aha-pill">✓ Bills being prepared</span><span class="aha-pill">✓ Everyday protected</span><span class="aha-pill">'+(num(P.savePerPaycheck)>0?'✓ Savings planned':'Savings optional')+'</span>';
   const state=document.getElementById('ahaState');if(state&&safeEl&&num(safeEl.textContent)>0){const projected=safeEl.textContent;state.className='aha-state good';state.innerHTML='<strong>Your next paycheck gives you room to work with.</strong><p>After its planned jobs are covered, about '+projected+' is projected to become Safe2Spend.</p>'}
   const rows=document.querySelectorAll('#ahaAccomplish .aha-accomplish-row');if(rows[0]){const strong=rows[0].querySelector('strong');if(strong)strong.textContent='Your upcoming bills are being prepared for.';const p=rows[0].querySelector('p');if(p&&!p.textContent.includes('from this paycheck'))p.textContent=p.textContent+' from this paycheck.'}
 }
 const hadCanonical=hydrateCanonical();
 if(hadCanonical){const ob=document.getElementById('onboard');if(ob&&P.onboardingComplete)ob.classList.add('hide')}
 if(typeof buildAha==='function'&&!buildAha.__s2sIntegrity){const baseBuildAha=buildAha;buildAha=function(){baseBuildAha();patchAhaCopy();validateState('page5')};buildAha.__s2sIntegrity=true}
 if(typeof finish==='function'&&!finish.__s2sIntegrity){const baseFinish=finish;finish=function(){baseFinish();P.onboardingComplete=true;P.stateVersion=STATE_VERSION;saveState('finish');if(typeof render==='function')render()};finish.__s2sIntegrity=true}
 if(typeof render==='function'&&!render.__s2sIntegrity){const baseRender=render;render=function(){baseRender();const small=document.querySelector('.brand small');if(small)small.textContent='MVP 1.6 · Dev';document.title='Safe2Spend MVP 1.6 Dev';validateState('render')};render.__s2sIntegrity=true}
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&P.onboardingComplete)saveState('visibilitychange')});
 window.addEventListener('pagehide',()=>{if(P.onboardingComplete)saveState('pagehide')});
 const small=document.querySelector('.brand small');if(small)small.textContent='MVP 1.6 · Dev';document.title='Safe2Spend MVP 1.6 Dev';patchAhaCopy();if(typeof render==='function')render();validateState('install');
})();
`;
 d.body.appendChild(patch);
 return true;
}
