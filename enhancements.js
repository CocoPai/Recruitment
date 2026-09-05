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
function renderCustomQuestions(){
  const list=$('#question-list');if(!list)return;
  const questions=JSON.parse(localStorage.getItem('recruitment-custom-questions')||'[]');
  questions.forEach((q,index)=>{
    if(list.querySelector('[data-custom-question="'+index+'"]'))return;
    const item=document.createElement('div');item.className='question-item';item.dataset.customQuestion=index;
    item.innerHTML='<strong>'+escapeHtml(q.question)+'</strong><p>'+escapeHtml(q.hint)+'</p><button class="text-btn custom-question-delete" data-delete-question="'+index+'">删除</button>';
    list.appendChild(item);
  });
}
$('#add-question-btn').onclick=addCustomQuestion;
renderCustomQuestions();

document.addEventListener('click',e=>{
  const button=e.target.closest('[data-delete-question]');if(!button)return;
  const questions=JSON.parse(localStorage.getItem('recruitment-custom-questions')||'[]');
  questions.splice(Number(button.dataset.deleteQuestion),1);
  localStorage.setItem('recruitment-custom-questions',JSON.stringify(questions));
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
