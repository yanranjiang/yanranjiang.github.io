'use strict';
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const esc=escapeHTML;
let DATA, family='posture', page=0, selected=null, visible=[];
const pageSize=9;
const suites={libero_goal:'GOAL',libero_spatial:'Spatial',libero_object:'Object',libero_10:'Long'};
const policies={dm05:'DM0.5',pi05:'π0.5',pi0:'π0','OpenVLA-OFT':'OpenVLA-OFT'};
const names={original:'Original control',revised:'Revised instruction',suffix:'Revised suffix only',physical_reference:'Physical reference controller',destination:'Destination revision',object:'Object revision',cancel:'Cancellation',forward_runtime:'Keep forward order',reverse_runtime:'Reverse the order',neutral_original:'Original instruction · neutral posture',neutral_revised:'Revised instruction · neutral posture',explicit_replace:'Explicit replacement wording',hold_revised:'Revised instruction · hold control',original_full:'Original full instruction',revised_full:'Revised full instruction',revised_suffix_only:'Revised suffix only'};
function prettyArm(b){return names[b?.context?.arm]||String(b?.context?.arm||'Branch').replaceAll('_',' ');}
function metric(v){return v===true?'<span class="yes">Yes</span>':v===false?'<span class="no">No</span>':'<span class="unknown">Not scored / unavailable</span>';}
function objectName(s){return String(s).replace(/_\d+$/,'').replaceAll('_',' ').replace('alphabet soup','soup');}
function firstText(b){let f=b?.first_contact;if(!f)return 'No verified first-contact record';return f.objects.map(objectName).join(' + ')+(f.action!=null?' · action '+f.action:'');}
function activeMetric(item){
  const arm=item.right?.context?.arm||'';
  if(item.family==='order')return 'requested_order';
  if(item.family==='layout')return 'revised_full';
  if(item.family==='cancellation'||item.family==='reference')return null;
  if(item.family==='revision')return arm.includes('destination')?'destination':item.right?.suite==='libero_spatial'?'target':'object';
  return 'revised';
}
function describe(item){
  const k=activeMetric(item),l=item.left?.metrics?.[k],r=item.right?.metrics?.[k];
  const a=item.left?.first_contact?.objects||[],b=item.right?.first_contact?.objects||[];
  if(item.family==='cancellation')return ['Inspect stopping behavior; there is no frozen safe-stop score.','The displayed goal outcomes describe task execution, not successful cancellation. Review residual movement and object release before drawing a safety conclusion.'];
  if(item.family==='reference')return ['A physical reference is not a VLA result.','Compare the controller’s outcome with the policy continuation. A successful physical reference is a feasibility witness; an unsuccessful reference does not establish impossibility.'];
  if(item.family==='posture'&&a.length&&b.length){
    if(JSON.stringify(a)===JSON.stringify(b))return ['The first contacted object did not change in this pair.',`Both branches first contact ${a.map(objectName).join(' and ')}. ${r?.final?'The revised goal is nevertheless satisfied at the end—later attainment is different from immediate reselection.':'The revised final goal is not achieved in the recorded continuation.'}`];
    return ['The instruction changes the first contacted object in this posture.',`Left first contacts ${a.map(objectName).join(' and ')}; right first contacts ${b.map(objectName).join(' and ')}. ${r?.final?'The right branch also satisfies the revised final goal.':'The right branch does not satisfy the revised final goal: object selection and completion are separate outcomes.'}`];
  }
  if(item.family==='layout'&&item.kind==='scene-layout')return ['Read this as a scene/layout comparison—not a same-state test.',`The recorded revised full goal has Held-10 ${l?.held10===true?'yes':'no / unavailable'} on the left and ${r?.held10===true?'yes':'no / unavailable'} on the right. Physical configurations differ, so this is limited evidence of configuration sensitivity, not an isolated internal mechanism.`];
  if(item.family==='order')return [r?.held10?'The revised order is satisfied in this recorded pair.':'Completing both placements is not the same as following the revised order.',`Right-branch ordered Held-10: ${r?.held10===true?'yes':'no / unavailable'}. Right-branch full placement goal Held-10: ${item.right?.metrics?.full?.held10===true?'yes':'no / unavailable'}. Use the sequence-aware result to judge an order revision.`];
  if(!r)return ['This pair needs direct evidence review.','No comparable revised-goal metric is available in the reader. Consult the source records; absence of a metric is not failure.'];
  if(r.held10&&!r.final)return ['The revised goal was reached, but did not persist to the end.','The updated branch satisfies Held-10 but fails Final. This is temporary attainment, not sustained completion. Watch what happens after first success.'];
  if(r.held10&&l?.held10)return ['Both branches satisfy the revised goal at some point.','Even the comparison branch reaches the revised goal for 10 steps. This score alone cannot attribute attainment to the instruction change; compare contacts, goal timing and subsequent behavior.'];
  if(r.held10)return ['The revised branch attains the updated goal in this pair.',`The comparison branch ${l?.held10===false?'does not reach revised-goal Held-10':'has no verified revised-goal Held-10 result'}. Revised Final is ${r.final?'yes':'no'}. This observation is specific to this state, phase and recorded budget.`];
  return ['The updated branch does not reach revised-goal Held-10.',`Original-goal Held-10 in the updated branch is ${item.right?.metrics?.original?.held10===true?'yes':'no / unavailable'}. Review first contacts and manipulation behavior; failure alone does not distinguish selection, feasibility and execution problems.`];
}
function questionView(){
  $('question-grid').innerHTML=DATA.questions.map((q,i)=>`<button class="question" data-family="${esc(q.id)}" aria-pressed="${family===q.id}"><span class="number">${String(i+1).padStart(2,'0')}</span><span>${esc(q.short)}</span></button>`).join('');
  $('question-grid').querySelectorAll('button').forEach(b=>b.onclick=()=>chooseFamily(b.dataset.family));
  const q=DATA.questions.find(x=>x.id===family);
  $('study').hidden=!q;
  if(q){for(const [id,key] of [['study-title','title'],['study-question','question'],['study-design','design'],['study-watch','watch'],['study-limit','limit']])$(id).textContent=q[key];$('study-tag').textContent='QUESTION / '+q.short.toUpperCase();}
  const summary=$('posture-summary');summary.innerHTML='';
  if(family==='posture'){
    summary.innerHTML='<h3>Five-state evidence: first selection ≠ final completion</h3><div class="table-wrap"><table><thead><tr><th>Arm posture</th><th>Instruction</th><th>Soup first</th><th>Cheese first</th><th>Cheese goal at end</th></tr></thead><tbody>'+DATA.posture_summary.map(r=>`<tr><td>${r.posture==='intervention-posture'?'Original intervention pose':'Neutral / repositioned'}</td><td>${esc(r.instruction)}</td><td>${r.soup_first}/${r.n}</td><td>${r.cheese_first}/${r.n}</td><td>${r.cheese_final}/${r.n}</td></tr>`).join('')+'</tbody></table></div><div class="posture-note"><strong>Takeaway:</strong> In these five states, neutral posture changes instruction-dependent object selection. It does <em>not</em> consistently improve final completion. The original-posture revised branch can attain cheese later despite contacting soup first.<br><span class="muted">600-action continuations. First contact is not proof of grasp. This is a small engineering comparison, not a general model ranking.</span></div>';
  }
}
function chooseFamily(f){family=f;page=0;for(const id of ['policy','suite','state','phase','search'])$(id).value='';$('status').value='READY';questionView();filter();if(visible.length)selectCase(visible[0].id);}
function fillFilters(){
  for(const id of ['policy','suite','state','phase']){
    const vals=[...new Set(DATA.items.map(i=>i.right?.[id]).filter(v=>v!=null))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));
    for(const val of vals){const op=document.createElement('option');op.value=val;op.textContent=id==='suite'?(suites[val]||val):id==='policy'?(policies[val]||val):val;$(id).append(op);}
    $(id).onchange=()=>{page=0;filter();};
  }
  $('search').oninput=()=>{page=0;filter();};$('status').onchange=()=>{page=0;filter();};
}
function filter(){
  const query=$('search').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  visible=DATA.items.filter(i=>(!family||i.family===family)&&['policy','suite','state','phase'].every(k=>!$(k).value||String(i.right?.[k])===$(k).value)&&(!$('status').value||i.status===$('status').value)&&query.every(t=>JSON.stringify([i.title,i.id,i.left?.context,i.right?.context]).toLowerCase().includes(t)));
  visible.sort((a,b)=>Number(a.right?.state||0)-Number(b.right?.state||0)||a.id.localeCompare(b.id));
  page=Math.min(page,Math.max(0,Math.ceil(visible.length/pageSize)-1));
  $('match-count').textContent=`${visible.length} comparisons · page ${page+1} of ${Math.max(1,Math.ceil(visible.length/pageSize))}. Reused controls are not independent trials.`;
  $('case-list').innerHTML=visible.slice(page*pageSize,(page+1)*pageSize).map(i=>`<button class="case" data-id="${esc(i.id)}" aria-pressed="${selected?.id===i.id}"><strong>${esc(policies[i.right?.policy]||i.right?.policy||i.title)} · ${esc(suites[i.right?.suite]||i.right?.suite||'')} · state ${esc(i.right?.state??'?')}</strong><small>${esc(prettyArm(i.left))} → ${esc(prettyArm(i.right))}</small><small>${esc(i.right?.phase||'Saved progress')} · ${esc(i.status==='READY'?(i.has_prefix?'Includes original prefix':'Starts at saved boundary'):i.status)}</small></button>`).join('')||'<p class="empty">No comparisons match. Clear a filter or browse all studies.</p>';
  $('case-list').querySelectorAll('button').forEach(b=>b.onclick=()=>{selectCase(b.dataset.id);$('viewer').scrollIntoView({behavior:'smooth'});});
  $('previous').disabled=page===0;$('next').disabled=(page+1)*pageSize>=visible.length;
}
function selectCase(id){
  const item=DATA.items.find(i=>i.id===id);if(!item)return;selected=item;
  const q=DATA.questions.find(q=>q.id===item.family),l=item.left,r=item.right;
  $('case-kicker').textContent=q?.short.toUpperCase()||'COMPARISON';
  $('case-title').textContent=`${policies[r?.policy]||r?.policy||'Recorded policy'} · ${suites[r?.suite]||r?.suite||''} · source ${r?.source??'?'} · state ${r?.state??'?'}`;
  $('case-subtitle').textContent=prettyArm(l)+'  versus  '+prettyArm(r);
  $('case-badge').textContent=item.kind==='scene-layout'?'Different physical configurations':item.kind==='hold-control'?'Preparation differs':item.family==='posture'?'Paired within this posture':item.kind==='reference'?'Policy vs reference':'Paired diagnostic';
  const boundaries=`Left: ${l?.context.boundary??'unverified'} / right: ${r?.context.boundary??'unverified'} original-task actions.`;
  $('boundary-note').textContent=boundaries+' '+(item.has_prefix?'The clip includes the recorded original-task prefix.':'The clip begins at saved continuation states; pre-update footage is not included.')+' '+(item.preparation?`${item.preparation} controller actions reposition the arm before the instruction-conditioned continuation. `:'')+'The branch instruction applies before continuation action 1. The orange pause is presentation only.';
  $('instruction-cards').innerHTML=[l,r].map((b,j)=>`<article class="instruction-card"><p class="label">${j?'RIGHT':'LEFT'} · ${esc(prettyArm(b).toUpperCase())}</p><p class="label">Original instruction</p><blockquote>${esc(b?.context.original||'Not verified')}</blockquote><p class="label">Instruction for this continuation</p><blockquote>${esc(b?.context.instruction||'Not recorded')}</blockquote><p>${esc(b?.context.change||'')}</p></article>`).join('');
  const video=$('video');video.pause();video.removeAttribute('src');video.load();video.hidden=!item.video;$('video-unavailable').hidden=!!item.video;
  $('video-unavailable').textContent='This comparison is not ready: '+(item.reason||item.status)+'. It is not counted as a policy failure.';
  if(item.video){video.src=item.video;video.load();video.playbackRate=Number($('speed').value);}
  $('mp4').hidden=!item.video;$('mp4').href=item.video||'#';
  $('jump-boundary').disabled=!item.video;$('jump-after').disabled=!item.video;
  const boundarySeconds=item.has_prefix?((item.prefix_actions||0)+1+(item.preparation||0))/item.fps:0;
  function seek(t){if(video.readyState>=1){video.currentTime=Math.min(t,video.duration||t);}else{video.addEventListener('loadedmetadata',()=>{if(selected?.id===item.id)video.currentTime=Math.min(t,video.duration||t);},{once:true});}}
  $('jump-boundary').onclick=()=>seek(boundarySeconds);$('jump-after').onclick=()=>seek(boundarySeconds+item.freeze_frames/item.fps);
  const takeaway=describe(item);$('takeaway-title').textContent=takeaway[0];$('takeaway-text').textContent=takeaway[1];
  $('contacts').innerHTML=[l,r].map((b,j)=>`<div class="contact-row"><span>${j?'Right':'Left'}</span><strong>${esc(firstText(b))}</strong></div>`).join('');
  const metricNames=[...new Set([...Object.keys(l?.metrics||{}),...Object.keys(r?.metrics||{})])];
  $('outcomes').innerHTML='<div class="table-wrap"><table><thead><tr><th>Recorded predicate</th><th>Left Ever</th><th>Left Held-10</th><th>Left Final</th><th>Right Ever</th><th>Right Held-10</th><th>Right Final</th></tr></thead><tbody>'+metricNames.map(k=>`<tr><td>${esc(k.replaceAll('_',' '))}</td>`+[l,r].map(b=>['ever','held10','final'].map(m=>'<td>'+metric(b?.metrics?.[k]?.[m])+'</td>').join('')).join('')+'</tr>').join('')+'</tbody></table></div>';
  $('verification').textContent=item.boundary_verification+' '+(item.exact_alignment.every(Boolean)?'Frame/action alignment verified for both continuations.':'Legacy/unverified frame-action alignment: use summary metrics, not inferred action timestamps.');
  $('qualification').textContent=(q?.limit||'')+' Existing checkpoint and pipeline qualification caveats still apply. This presentation does not revalidate or rescore the experiment.';
  $('source-links').innerHTML=[['Comparison receipt',item.receipt],['Left source evidence',l?.evidence],['Right source evidence',r?.evidence]].filter(x=>x[1]).map(([title,path])=>`<a href="${esc(path)}" target="_blank" rel="noopener">${esc(title)} ↗</a>`).join('');
  $('case-id').textContent='Comparison ID: '+item.id+' · '+item.group;
  history.replaceState(null,'','?case='+encodeURIComponent(id));filter();
}
async function main(){
  const response=await fetch('/dtu-bench/reader_assets/catalog.json',{cache:'no-cache'});if(!response.ok)throw Error('Cannot load evidence catalog: '+response.status);DATA=await response.json();
  $('coverage').textContent=`${DATA.counts.READY||0} ready comparisons · ${DATA.counts.REVIEW_REQUIRED||0} need review · real recordings`;
  $('scope').textContent=DATA.scope;fillFilters();
  const id=new URLSearchParams(location.search).get('case');const wanted=DATA.items.find(i=>i.id===id);
  family=wanted?.family||'posture';questionView();filter();selectCase(wanted?.id||'posture-1-intervention-posture');
  $('show-all').onclick=()=>chooseFamily('');$('previous').onclick=()=>{page--;filter();};$('next').onclick=()=>{page++;filter();};$('speed').onchange=()=>$('video').playbackRate=Number($('speed').value);
  document.documentElement.dataset.readerReady='true';
}
main().catch(e=>{$('load-error').hidden=false;$('load-error').textContent='The reader could not load: '+e.message+'. The original archive link remains available.';console.error(e);});
