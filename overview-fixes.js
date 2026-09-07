function refreshOverviewFromData(){
  if(typeof jobs==='undefined')return;
  const submitted=jobs.filter(j=>!['想投递','拒绝'].includes(j.status)).length;
  const active=jobs.filter(j=>!['拒绝','Offer'].includes(j.status)).length;
  const interviewCount=jobs.filter(j=>['已一面','已二面','已终面'].includes(j.status)).length;
  const offerCount=jobs.filter(j=>j.status==='Offer').length;
  const next=interviews.filter(i=>i.date).sort((a,b)=>a.date.localeCompare(b.date))[0];

  const title=jobs.length?'你的秋招进度，正在一点点清晰。':'先添加一个目标岗位，开始你的秋招记录。';
  const subtitle=jobs.length?'已记录 '+jobs.length+' 个岗位，当前有 '+active+' 个机会在推进中。':'录入想投递的企业、岗位要求和链接后，这里会自动生成你的进度。';
  const heroTitle=$('#hero-title'),heroSubtitle=$('#hero-subtitle');
  if(heroTitle)heroTitle.textContent=title;
  if(heroSubtitle)heroSubtitle.textContent=subtitle;
  const values=[submitted,active,interviewCount,offerCount];
  const labels=['已投递','进行中','面试中','Offer'];
  const feet=[jobs.length?'含目标岗位 '+jobs.filter(j=>j.status==='想投递').length+' 个':'等待添加岗位',active?'正在推进 '+active+' 个岗位':'暂无推进中的岗位',next?'最近面试 '+next.date:'还没有面试安排',offerCount?'继续保持':'还在积累机会'];
  const colors=['var(--purple)','var(--blue)','var(--peach)','var(--mint)'];
  const stats=$('#stats-grid');
  if(stats)stats.innerHTML=labels.map((label,i)=>'<div class="stat-card"><span class="stat-label">'+label+'</span><div class="stat-value">'+values[i]+'</div><span class="stat-dot" style="background:'+colors[i]+'"></span><span class="stat-foot">'+feet[i]+'</span></div>').join('');
}
if(!localStorage.getItem('recruitment-jobs')&&typeof jobs!=='undefined'){jobs=[];if(typeof render==='function')render();}
refreshOverviewFromData();
document.addEventListener('click',()=>setTimeout(refreshOverviewFromData,80),true);
document.addEventListener('submit',()=>setTimeout(refreshOverviewFromData,120),true);
document.addEventListener('input',()=>setTimeout(refreshOverviewFromData,120),true);
