let detailJobId=null;
let editingInterviewId=null;
function openJobDetail(id){
  detailJobId=id;
  const j=jobs.find(x=>x.id===id); if(!j)return;
  const related=interviews.filter(x=>x.jobId===id).sort((a,b)=>b.date.localeCompare(a.date));
  $('#detail-title').textContent=j.company+' · '+j.role;
  $('#detail-content').innerHTML='<div class="detail-summary"><span class="detail-pill">阶段：'+escapeHtml(j.status)+'</span><span class="detail-pill">投递意愿：'+escapeHtml(j.priority)+'</span><span class="detail-pill">城市：'+escapeHtml(j.city||'未填写')+'</span>'+(j.nextDate?'<span class="detail-pill">下一步：'+j.nextDate+'</span>':'')+'</div><div class="detail-section"><h4>岗位备注</h4><p>'+escapeHtml(j.notes||'暂无岗位备注')+'</p></div><div class="detail-section"><h4>面试与复盘（'+related.length+'）</h4>'+(related.length?related.map(i=>'<div class="detail-interview"><strong>'+escapeHtml(i.round)+' · '+escapeHtml(i.type)+'</strong><small>'+i.date+'</small><p><b>问题：</b>'+escapeHtml(i.questions||'未记录')+'<br><b>反馈：</b>'+escapeHtml(i.feedback||'未记录')+'<br><b>改进：</b>'+escapeHtml(i.improve||'未记录')+'</p></div>').join(''):'<div class="detail-empty">还没有面试复盘，面试后及时记录会更有价值。</div>')+'</div>';
  $('#detail-modal-backdrop').classList.add('open');
}
function closeJobDetail(){$('#detail-modal-backdrop').classList.remove('open')}
document.addEventListener('click',e=>{
  const card=e.target.closest('[data-edit]');
  if(card){e.stopPropagation();openJobDetail(Number(card.dataset.edit));}
},true);
$('#close-detail-modal').onclick=closeJobDetail;
$('#detail-edit-btn').onclick=()=>{closeJobDetail();openModal(detailJobId)};
$('#add-interview-btn').onclick=()=>{editingInterviewId=null;openInterviewModal()};
$('#detail-interview-btn').onclick=()=>{editingInterviewId=null;closeJobDetail();openInterviewModal();setTimeout(()=>{$('#interview-job-input').value=String(detailJobId)},0)};
$('#detail-delete-btn').onclick=()=>{
  const job=jobs.find(j=>j.id===detailJobId);if(!job)return;
  if(!confirm('确定删除 '+job.company+' · '+job.role+' 吗？'))return;
  jobs=jobs.filter(j=>j.id!==detailJobId);interviews=interviews.filter(i=>i.jobId!==detailJobId);
  save();closeJobDetail();render();showToast('岗位及关联复盘已删除');
};
$('#export-btn').onclick=()=>{
  const data={version:1,exportedAt:new Date().toISOString(),jobs,interviews,tasks,customQuestions:JSON.parse(localStorage.getItem('recruitment-custom-questions')||'[]'),notes:localStorage.getItem('recruitment-notes')||''};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='秋招作战台备份-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);showToast('备份已导出');
};
$('#import-btn').onclick=()=>$('#import-file').click();
$('#import-file').addEventListener('change',e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{try{const data=JSON.parse(reader.result);if(!Array.isArray(data.jobs)||!Array.isArray(data.interviews))throw new Error('invalid');jobs=data.jobs;interviews=data.interviews;tasks=Array.isArray(data.tasks)?data.tasks:tasks;if(Array.isArray(data.customQuestions))localStorage.setItem('recruitment-custom-questions',JSON.stringify(data.customQuestions));if(typeof data.notes==='string')localStorage.setItem('recruitment-notes',data.notes);save();render();renderCustomQuestions();showToast('备份已恢复')}catch(err){showToast('文件格式不正确，无法导入')}e.target.value=''};
  reader.readAsText(file);
});

function addCustomQuestion(){
  const question=prompt('请输入想加入题库的问题：');
  if(!question||!question.trim())return;
  const questions=JSON.parse(localStorage.getItem('recruitment-custom-questions')||'[]');
  questions.push({question:question.trim(),hint:'来自你的真实面试，可在下次面试前复习'});
  localStorage.setItem('recruitment-custom-questions',JSON.stringify(questions));
  renderCustomQuestions();showToast('问题已加入题库');
}
function migrateQuestionAnswer(oldQuestion,newQuestion){try{const answers=JSON.parse(localStorage.getItem('recruitment-prep-answers')||'{}');if(Object.prototype.hasOwnProperty.call(answers,oldQuestion)){answers[newQuestion]=answers[oldQuestion];delete answers[oldQuestion];localStorage.setItem('recruitment-prep-answers',JSON.stringify(answers))}}catch(e){}}
function editCustomQuestion(index){const questions=JSON.parse(localStorage.getItem('recruitment-custom-questions')||'[]'),current=questions[index];if(!current)return;const question=prompt('修改问题：',current.question);if(!question||!question.trim())return;const hint=prompt('修改提示（可留空）：',current.hint||'');migrateQuestionAnswer(current.question,question.trim());questions[index]={question:question.trim(),hint:(hint||'').trim()};localStorage.setItem('recruitment-custom-questions',JSON.stringify(questions));render();renderCustomQuestions();showToast('问题已更新')}
function renderCustomQuestions(){
  const list=$('#question-list');if(!list)return;
  const questions=JSON.parse(localStorage.getItem('recruitment-custom-questions')||'[]');
  questions.forEach((q,index)=>{
    if(list.querySelector('[data-custom-question="'+index+'"]'))return;
    const item=document.createElement('div');item.className='question-item';item.dataset.customQuestion=index;
    item.innerHTML='<strong>'+escapeHtml(q.question)+'</strong><p>'+escapeHtml(q.hint)+'</p><button class="text-btn custom-question-edit" data-edit-question="'+index+'">编辑</button> <button class="text-btn custom-question-delete" data-delete-question="'+index+'">删除</button>';
    list.appendChild(item);
  });
}
$('#add-question-btn').onclick=addCustomQuestion;
renderCustomQuestions();

document.addEventListener('click',e=>{
  const edit=e.target.closest('[data-edit-question]');
  if(edit){e.stopPropagation();editCustomQuestion(Number(edit.dataset.editQuestion));return;}
  const button=e.target.closest('[data-delete-question]');if(!button)return;
  const questions=JSON.parse(localStorage.getItem('recruitment-custom-questions')||'[]'),index=Number(button.dataset.deleteQuestion),removed=questions[index];
  if(removed){const answers=JSON.parse(localStorage.getItem('recruitment-prep-answers')||'{}');delete answers[removed.question];localStorage.setItem('recruitment-prep-answers',JSON.stringify(answers));}
  questions.splice(index,1);localStorage.setItem('recruitment-custom-questions',JSON.stringify(questions));
  render();renderCustomQuestions();showToast('问题已从题库移除');
});

const originalOpenJobDetail=openJobDetail;
openJobDetail=function(id){
  originalOpenJobDetail(id);
  const related=interviews.filter(x=>x.jobId===id).sort((a,b)=>b.date.localeCompare(a.date));
  document.querySelectorAll('#detail-content .detail-interview').forEach((item,index)=>{
    if(item.querySelector('[data-delete-interview]'))return;
    item.insertAdjacentHTML('beforeend','<button class="text-btn" data-edit-interview="'+related[index].id+'">编辑</button> <button class="text-btn delete-interview" data-delete-interview="'+related[index].id+'">删除这条复盘</button>');
  });
};
document.addEventListener('click',e=>{
  const edit=e.target.closest('[data-edit-interview]');
  if(edit){e.stopPropagation();editInterview(Number(edit.dataset.editInterview));return;}
  const button=e.target.closest('[data-delete-interview]');
  if(!button)return;
  if(!confirm('确定删除这条面试复盘吗？'))return;
  interviews=interviews.filter(i=>i.id!==Number(button.dataset.deleteInterview));
  save();openJobDetail(detailJobId);render();showToast('面试复盘已删除');
});

function editInterview(id){
  const record=interviews.find(i=>i.id===id);if(!record)return;
  editingInterviewId=id;openInterviewModal();
  const form=$('#interview-form');
  form.jobId.value=String(record.jobId);form.round.value=record.round;form.date.value=record.date;form.type.value=record.type;
  form.questions.value=record.questions||'';form.feedback.value=record.feedback||'';form.improve.value=record.improve||'';
}

let calendarOffset=0;
function renderCalendarMonth(){
  const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+calendarOffset);
  const y=base.getFullYear(),m=base.getMonth(),first=(base.getDay()+6)%7,last=new Date(y,m+1,0).getDate();
  $('#calendar-month').textContent=y+' 年 '+(m+1)+' 月';
  let html='';for(let i=0;i<first;i++)html+='<div class="cal-day muted">·</div>';
  for(let d=1;d<=last;d++){const ds=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');html+='<div class="cal-day '+(calendarOffset===0&&d===new Date().getDate()?'today ':'')+(interviews.some(i=>i.date===ds)?'has-event':'')+'">'+d+'</div>'}
  $('#calendar-grid').innerHTML=html;
}
document.addEventListener('click',e=>{
  const button=e.target.closest('.calendar-title button');if(!button)return;
  calendarOffset+=button.textContent.trim()==='‹'?-1:1;renderCalendarMonth();
});

const defaultPrepQuestions=[
  ['请做一下自我介绍','准备 1 分钟版本，突出岗位相关经历'],
  ['为什么选择我们公司？','用业务、岗位、个人成长三个角度回答'],
  ['讲一个你解决复杂问题的经历','STAR 法则：情境、任务、行动、结果'],
  ['你有什么想问我们的？','准备 2-3 个有思考的问题']
];
const prepOverrideKey='recruitment-prep-question-overrides';
function readPrepOverrides(){try{return JSON.parse(localStorage.getItem(prepOverrideKey)||'{}')}catch(e){return{}}}
function renderAllPrepQuestions(){
  const list=$('#question-list');if(!list)return;
  const overrides=readPrepOverrides();
  list.innerHTML=defaultPrepQuestions.filter(x=>!overrides[x[0]]||!overrides[x[0]].deleted).map(x=>{
    const v=overrides[x[0]]||{},q=v.question||x[0],hint=v.hint===undefined?x[1]:v.hint;
    return '<div class="question-item" data-fixed-question="'+escapeHtml(x[0])+'"><strong>'+escapeHtml(q)+'</strong><p>'+escapeHtml(hint)+'</p><div class="question-management"><button type="button" class="text-btn" data-edit-fixed-question>编辑</button><button type="button" class="text-btn" data-delete-fixed-question>删除</button></div></div>';
  }).join('');
  renderCustomQuestions();
}
renderQuestions=renderAllPrepQuestions;
function editFixedQuestion(item){
  const original=item.dataset.fixedQuestion,overrides=readPrepOverrides(),current=overrides[original]||{};
  const question=prompt('修改问题：',current.question||original);if(!question||!question.trim())return;
  const hint=prompt('修改提示（可留空）：',current.hint===undefined?'':current.hint);
  migrateQuestionAnswer(current.question||original,question.trim());
  overrides[original]={question:question.trim(),hint:(hint||'').trim()};
  localStorage.setItem(prepOverrideKey,JSON.stringify(overrides));renderAllPrepQuestions();showToast('问题已更新');
}
function deleteFixedQuestion(item){
  const original=item.dataset.fixedQuestion,overrides=readPrepOverrides(),current=overrides[original]||{};
  if(!confirm('确定删除这个高频问题吗？'))return;
  const answers=JSON.parse(localStorage.getItem('recruitment-prep-answers')||'{}');
  delete answers[current.question||original];localStorage.setItem('recruitment-prep-answers',JSON.stringify(answers));
  overrides[original]={...(current.question?current:{question:original}),deleted:true};
  localStorage.setItem(prepOverrideKey,JSON.stringify(overrides));renderAllPrepQuestions();showToast('问题已删除');
}
const prepQuestionStyle=document.createElement('style');
prepQuestionStyle.textContent='.question-management{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}.question-management .text-btn{padding:2px 0;color:#999;font-size:11px}.question-management .text-btn:hover{color:#6658dc}';
document.head.appendChild(prepQuestionStyle);
document.addEventListener('click',e=>{
  const item=e.target.closest('[data-fixed-question]');if(!item)return;
  if(e.target.closest('[data-edit-fixed-question]')){e.stopPropagation();editFixedQuestion(item);return}
  if(e.target.closest('[data-delete-fixed-question]')){e.stopPropagation();deleteFixedQuestion(item)}
});
renderAllPrepQuestions();

function openQuestionEditor(item){
  const oldQuestion=item.querySelector('strong').textContent.trim(),oldHint=item.querySelector('p')?.textContent.trim()||'',answers=JSON.parse(localStorage.getItem('recruitment-prep-answers')||'{}');
  document.querySelector('#question-editor-modal')?.remove();
  const modal=document.createElement('div');modal.id='question-editor-modal';modal.className='question-editor-backdrop';
  modal.innerHTML='<div class="question-editor"><div class="question-editor-head"><h3>编辑高频问题</h3><button type="button" class="question-editor-close">×</button></div><label>问题<input class="question-editor-title"></label><label>提示说明<input class="question-editor-hint"></label><label>我的回答<textarea class="question-editor-answer" placeholder="写下你的回答……"></textarea></label><div class="question-editor-actions"><button type="button" class="secondary-btn question-editor-cancel">取消</button><button type="button" class="primary-btn question-editor-save">保存</button></div></div>';
  document.body.appendChild(modal);
  modal.querySelector('.question-editor-title').value=oldQuestion;
  modal.querySelector('.question-editor-hint').value=oldHint;
  modal.querySelector('.question-editor-answer').value=answers[oldQuestion]||'';
  const close=()=>modal.remove();
  modal.querySelector('.question-editor-close').onclick=close;modal.querySelector('.question-editor-cancel').onclick=close;
  modal.querySelector('.question-editor-save').onclick=()=>{
    const question=modal.querySelector('.question-editor-title').value.trim();if(!question){showToast('\u8bf7\u586b\u5199\u95ee\u9898');return}
    const hint=modal.querySelector('.question-editor-hint').value.trim(),answer=modal.querySelector('.question-editor-answer').value;
    const fixed=item.dataset.fixedQuestion,custom=item.dataset.customQuestion;
    migrateQuestionAnswer(oldQuestion,question);
    const nextAnswers=JSON.parse(localStorage.getItem('recruitment-prep-answers')||'{}');if(answer.trim())nextAnswers[question]=answer;else delete nextAnswers[question];localStorage.setItem('recruitment-prep-answers',JSON.stringify(nextAnswers));
    if(fixed){const overrides=readPrepOverrides();overrides[fixed]={question,hint};localStorage.setItem(prepOverrideKey,JSON.stringify(overrides))}
    else if(custom!==undefined){const list=JSON.parse(localStorage.getItem('recruitment-custom-questions')||'[]');if(list[Number(custom)]){list[Number(custom)]={question,hint};localStorage.setItem('recruitment-custom-questions',JSON.stringify(list))}}
    close();render();renderCustomQuestions();showToast('\u95ee\u9898\u548c\u56de\u7b54\u5df2\u4fdd\u5b58');
  };
  modal.onclick=e=>{if(e.target===modal)close()};
  modal.querySelector('.question-editor-title').focus();
}
function deleteQuestionItem(item){
  const question=item.querySelector('strong').textContent.trim();if(!confirm('\u786e\u5b9a\u5220\u9664\u8fd9\u4e2a\u95ee\u9898\u5417\uff1f'))return;
  const answers=JSON.parse(localStorage.getItem('recruitment-prep-answers')||'{}');delete answers[question];localStorage.setItem('recruitment-prep-answers',JSON.stringify(answers));
  if(item.dataset.fixedQuestion){const overrides=readPrepOverrides();overrides[item.dataset.fixedQuestion]={question,deleted:true};localStorage.setItem(prepOverrideKey,JSON.stringify(overrides))}
  else if(item.dataset.customQuestion!==undefined){const list=JSON.parse(localStorage.getItem('recruitment-custom-questions')||'[]');list.splice(Number(item.dataset.customQuestion),1);localStorage.setItem('recruitment-custom-questions',JSON.stringify(list))}
  render();renderCustomQuestions();showToast('\u95ee\u9898\u5df2\u5220\u9664');
}
function decorateQuestionTools(){
  const list=$('#question-list');if(!list)return;
  list.querySelectorAll('.question-item').forEach(item=>{
    if(item.querySelector('.question-tools'))return;
    const tools=document.createElement('div');tools.className='question-tools';
    tools.innerHTML='<button type="button" class="question-tool" data-question-edit title="编辑问题和回答" aria-label="编辑问题和回答"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.5V20h2.5L17.8 8.7l-2.5-2.5L4 17.5Zm14.7-10.3 1-1a1.4 1.4 0 0 0 0-2l-.9-.9a1.4 1.4 0 0 0-2 0l-1 1 2.9 2.9Z"/></svg></button><button type="button" class="question-tool danger" data-question-delete title="删除问题" aria-label="删除问题"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12m-8 0V5h4v2m-7 0 1 13h8l1-13M10 11v6m4-6v6"/></svg></button>';
    item.appendChild(tools);
  });
}
const questionToolStyle=document.createElement('style');
questionToolStyle.textContent='.question-item{padding-right:76px}.question-item>strong{font-size:15px}.question-management,.custom-question-edit,.custom-question-delete,.answer-action{display:none!important}.question-tools{position:absolute;right:0;top:8px;display:flex;gap:6px}.question-tool{width:28px;height:28px;display:grid;place-items:center;padding:0;border:1px solid #e6e4ef;border-radius:8px;background:#fff;color:#777;cursor:pointer}.question-tool:hover{border-color:#bdb5f6;background:#f7f5ff;color:#6658dc}.question-tool.danger:hover{border-color:#f2caca;background:#fff5f5;color:#d66}.question-tool svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.question-editor-backdrop{position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:20px;background:#231f4366}.question-editor{width:min(500px,calc(100vw - 40px));box-sizing:border-box;padding:22px;border-radius:16px;background:#fff;box-shadow:0 20px 60px #28235a33}.question-editor-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.question-editor-head h3{margin:0;color:#222}.question-editor-close{border:0;background:transparent;color:#999;font-size:24px;cursor:pointer}.question-editor label{display:block;margin-top:12px;color:#777;font-size:12px}.question-editor input,.question-editor textarea{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:10px;border:1px solid #e7e5f1;border-radius:8px;outline:0;font:13px inherit;color:#444}.question-editor textarea{min-height:130px;resize:vertical}.question-editor input:focus,.question-editor textarea:focus{border-color:#8d80eb}.question-editor-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}';
document.head.appendChild(questionToolStyle);
document.addEventListener('click',e=>{
  const edit=e.target.closest('[data-question-edit]');if(edit){e.stopPropagation();openQuestionEditor(edit.closest('.question-item'));return}
  const del=e.target.closest('[data-question-delete]');if(del){e.stopPropagation();deleteQuestionItem(del.closest('.question-item'))}
});
decorateQuestionTools();
const questionListObserver=$('#question-list');if(questionListObserver)new MutationObserver(()=>setTimeout(decorateQuestionTools,0)).observe(questionListObserver,{childList:true,subtree:true});
