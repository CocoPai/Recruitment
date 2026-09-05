function openInterviewModal(){
  const select=$('#interview-job-input');
  select.innerHTML=jobs.map(j=>'<option value="'+j.id+'">'+escapeHtml(j.company)+' · '+escapeHtml(j.role)+'</option>').join('');
  const form=$('#interview-form');
  form.reset();
  form.date.value=new Date().toISOString().slice(0,10);
  $('#interview-modal-backdrop').classList.add('open');
}
function closeInterviewModal(){$('#interview-modal-backdrop').classList.remove('open')}
$('#add-interview-btn').onclick=openInterviewModal;
$('#close-interview-modal').onclick=closeInterviewModal;
$('#cancel-interview-modal').onclick=closeInterviewModal;
$('#interview-form').addEventListener('submit',e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(e.target));
  const job=jobs.find(j=>j.id===Number(data.jobId));
  const record={id:editingInterviewId||Date.now(),jobId:Number(data.jobId),date:data.date,round:data.round,type:data.type,note:data.feedback||data.questions,questions:data.questions,feedback:data.feedback,improve:data.improve};
  if(editingInterviewId)interviews=interviews.map(i=>i.id===editingInterviewId?record:i);else interviews.push(record);
  if(job&&['想投递','已投递','已测评','已笔试'].includes(job.status))job.status=data.round==='HR面'?'已终面':'已'+data.round;
  editingInterviewId=null;save();closeInterviewModal();render();showToast('面试复盘已保存');
});
