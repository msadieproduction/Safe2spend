function installQaFixes(w,d){
 if(d.getElementById('mvp16QaFixes'))return;
 const patch=d.createElement('script');patch.id='mvp16QaFixes';patch.textContent=`
P.prePaydayAdjustments=Array.isArray(P.prePaydayAdjustments)?P.prePaydayAdjustments.filter(x=>String(x.payday||'')>=iso(today())).slice(0,50):[];
processScheduledPaycheckIfDue=function(){let pd=nextPayDates(1)[0];if(!pd||iso(pd)!==iso(today())||n(P.paycheck)<=0||paydayAlreadyProcessed(pd))return false;ensureS2S();let plan=paycheckPlan(pd,currentAvailable()),before=n(P.s2sBalance);adjustAvailable(n(P.paycheck));P.s2sBalance=Math.max(0,before+n(plan.safeAdd));P.s2sAnchor=suggestedCurrentS2S();P.lastProcessedPayday=iso(pd);P.s2sActivity=P.s2sActivity||[];P.s2sActivity.unshift({type:'add',amount:n(P.paycheck),desc:'Paycheck',date:new Date().toISOString(),mode:'paycheck',system:true,safeAdded:n(plan.safeAdd)});P.s2sActivity=P.s2sActivity.slice(0,50);localStorage.setItem(KEY,JSON.stringify(P));return true};
applyNeedSpend=function(amt){amt=n(amt);let c=needSpendCapacity();amt=Math.min(amt,c.max,currentAvailable());if(!amt)return;let desc=needSpendNote.value.trim()||'Spent before payday';adjustAvailable(-amt);P.prePaydayAdjustments=P.prePaydayAdjustments||[];P.prePaydayAdjustments.unshift({payday:iso(c.z.pd),amount:amt,desc,date:new Date().toISOString()});P.prePaydayAdjustments=P.prePaydayAdjustments.slice(0,50);P.s2sActivity=P.s2sActivity||[];P.s2sActivity.unshift({type:'spend',amount:amt,desc,date:new Date().toISOString(),mode:'prepayday'});P.s2sActivity=P.s2sActivity.slice(0,50);P.s2sAnchor=suggestedCurrentS2S();localStorage.setItem(KEY,JSON.stringify(P));closeM('needSpendM');render()};
localStorage.setItem(KEY,JSON.stringify(P));
`;d.body.appendChild(patch);
}
