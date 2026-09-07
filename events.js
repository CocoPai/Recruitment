(function(){
  let events=JSON.parse(localStorage.getItem('recruitment-events')||'[]');
  const saveEvents=()=>localStorage.setItem('recruitment-events',JSON.stringify(events));
  const button=document.createElement('button');
  button.className='primary-btn';button.id='add-event-btn';button.textContent='＋ 添加事件';
  const interviewButton=$('#add-interview-btn');
  if(interviewButton&&interviewButton.parentElement){interviewButton.parentElement.insertBefore(button,interviewButton);interviewButton.hidden=true;}
  const backdrop=document.createElement('div');backdrop.className='modal-backdrop';backdrop.id='event-modal-backdrop';
  backdrop.innerHTML='<div class="modal"><div class="modal-head"><h3>添加事件</h3><button class="close-btn" id="close-event-modal">×</button></div><form id="event-form"><label>事项名称<input name="title" required placeholder="例如：公务员报名截止" /></label><div class="form-grid"><label>日期<input name="date" type="date" required /></label><label>类型<select name="type"><option>报名截止</option><option>笔试</option><option>测评</option><option>宣讲会</option><option>其他</option><option>面试</option></select></label><label>重要程度<select name="priority"><option>重要</option><option selected>普通</option></select></label></div><label>备注<textarea name="note" placeholder="报名网址、材料清单、注意事项……"></textarea></label><div class="form-actions"><button type="button" class="secondary-btn" id="cancel-event-modal">取消</button><button class="primary-btn" type="submit">保存事件</button></div></form></div>';
  document.body.appendChild(backdrop);
  function open(){const f=$('#event-form');f.reset();f.date.value=new Date().toISOString().slice(0,10);backdrop.classList.add('open')}
  function close(){backdrop.classList.remove('open')}
  button.onclick=open;$('#close-event-modal').onclick=close;$('#cancel-event-modal').onclick=close;$('#event-form').elements.type.addEventListener('change',e=>{if(e.target.value==='面试'){const date=$('#event-form').elements.date.value;close();editingInterviewId=null;openInterviewModal();if(date)$('#interview-form').elements.date.value=date;}});
  $('#event-form').addEventListener('submit',e=>{
    e.preventDefault();const data=Object.fromEntries(new FormData(e.target));if(data.type==='面试'){const date=data.date;close();editingInterviewId=null;openInterviewModal();if(date)$('#interview-form').elements.date.value=date;return;}
    data.jobId=['测评','笔试'].includes(data.type)&&data.jobId?Number(data.jobId):null;events.push({id:Date.now(),...data});saveEvents();close();render();renderEvents();markEventDays();showToast('时间节点已添加');
  });
  function renderEvents(){
    const list=$('#all-interviews');if(!list)return;
    const old=list.querySelector('.independent-events');if(old)old.remove();
    const box=document.createElement('div');box.className='independent-events detail-section';
    const sorted=events.slice().sort((a,b)=>a.date.localeCompare(b.date));
    box.innerHTML='<div class="panel-head"><div><span class="section-kicker">IMPORTANT DATES</span><h3>独立时间节点</h3></div></div>';
    box.innerHTML+=sorted.length?sorted.map(x=>'<div class="interview-row event-row"><div class="date-block event-date"><b>'+x.date.slice(8)+'</b><small>'+x.date.slice(0,7)+'</small></div><div class="interview-info"><strong>'+escapeHtml(x.title)+'</strong><p>'+escapeHtml(x.type)+' · '+escapeHtml(x.priority)+(x.note?'　'+escapeHtml(x.note):'')+'</p></div><button class="text-btn" data-delete-event="'+x.id+'">删除</button></div>').join(''):'<div class="detail-empty">还没有独立时间节点。</div>';
    list.appendChild(box);
  }
  function markEventDays(){
    document.querySelectorAll('.cal-day').forEach(day=>{
      const dayText=day.textContent.trim();if(!/^\d+$/.test(dayText))return;
      const monthText=$('#calendar-month').textContent,match=monthText.match(/(\d+)\s*年\s*(\d+)\s*月/);if(!match)return;
      const date=match[1]+'-'+String(match[2]).padStart(2,'0')+'-'+String(dayText).padStart(2,'0');
      if(events.some(x=>x.date===date))day.classList.add('has-event');
    });
  }
  document.addEventListener('click',e=>{
    const del=e.target.closest('[data-delete-event]');if(!del)return;
    if(!confirm('确定删除这个时间节点吗？'))return;
    events=events.filter(x=>x.id!==Number(del.dataset.deleteEvent));saveEvents();renderEvents();markEventDays();showToast('时间节点已删除');
  });
  renderEvents();markEventDays();setInterval(()=>{renderEvents();markEventDays()},800);
  const eventForm=$('#event-form'),jobLabel=document.createElement('label');jobLabel.id='event-job-label';jobLabel.hidden=true;jobLabel.innerHTML='关联岗位<select name="jobId" id="event-job-input"><option value="">请选择岗位</option></select>';eventForm.elements.note.closest('label').before(jobLabel);
  function populateEventJobs(){const select=$('#event-job-input'),value=select.value;select.innerHTML='<option value="">请选择岗位</option>'+jobs.map(j=>'<option value="'+j.id+'">'+escapeHtml(j.company)+(j.role?' · '+escapeHtml(j.role):'')+'</option>').join('');select.value=value}
  function toggleEventJob(){jobLabel.hidden=!['测评','笔试'].includes(eventForm.elements.type.value);if(jobLabel.hidden)eventForm.elements.jobId.value=''}
  eventForm.elements.type.addEventListener('change',toggleEventJob);button.addEventListener('click',()=>setTimeout(()=>{populateEventJobs();toggleEventJob()},0));
  let migrated=false;events.forEach(x=>{if(x.type==='测评截止'){x.type='测评';migrated=true}});if(migrated)saveEvents();
  window.recruitmentEvents={get:()=>events,save:saveEvents};
})();
