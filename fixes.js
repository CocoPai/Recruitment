const baseOpenModal=openModal;
openModal=function(id=null){
  baseOpenModal(id);
  if(id){
    const job=jobs.find(j=>j.id===id);
    if(job&&$('#job-form').requirements)$('#job-form').requirements.value=job.requirements||'';
    if(job&&$('#job-form').description)$('#job-form').description.value=job.description||'';
    if(job&&$('#job-form').enterpriseType){const old=job.enterpriseType||'私企';$('#job-form').enterpriseType.value=(old==='央企'||old==='国企'||old==='事业单位'||old==='国央企')?'国央企':(old==='外企'?'外企':'私企');}
  }
};
const baseOpenJobDetail=openJobDetail;
openJobDetail=function(id){
  baseOpenJobDetail(id);
  const job=jobs.find(j=>j.id===id);if(!job)return;
  const content=$('#detail-content');
  const summary=content.querySelector('.detail-summary');
  if(summary){const old=job.enterpriseType||'私企';const type=(old==='央企'||old==='国企'||old==='事业单位'||old==='国央企')?'国央企':(old==='外企'?'外企':'私企');summary.insertAdjacentHTML('beforeend','<span class="detail-pill">企业类型：'+type+'</span>');}
  const section=document.createElement('div');section.className='detail-section';
  section.innerHTML='<h4>岗位描述</h4><p>'+escapeHtml(job.description||'暂未填写岗位描述')+'</p><div class="detail-section"><h4>岗位要求</h4><p>'+escapeHtml(job.requirements||'暂未填写岗位要求')+'</p></div><p class="job-url">'+(job.url?'<a href="'+escapeHtml(job.url)+'" target="_blank" rel="noopener">打开投递/招聘链接 ↗</a>':'暂未填写投递链接')+'</p>';
  content.insertBefore(section,content.firstElementChild&&content.firstElementChild.nextElementSibling);
};
