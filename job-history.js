(function(){
  const historyKey='stageHistory';
  const localDate=()=>{
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  };
  const escape=(value)=>typeof escapeHtml==='function'?escapeHtml(value||''):String(value||'');
  const normalise=(entry)=>({
    status:String(entry&&entry.status||'想投递'),
    date:String(entry&&entry.date||''),
    note:String(entry&&entry.note||''),
    source:String(entry&&entry.source||'manual')
  });
  function ensure(job){
    if(!job)return [];
    if(!Array.isArray(job[historyKey])){
      job[historyKey]=[{status:job.status||'想投递',date:'',note:'',source:'legacy'}];
    }else{
      job[historyKey]=job[historyKey].map(normalise).filter(x=>x.status);
      job[historyKey]=job[historyKey].filter((e,i,a)=>e.date||e.source!=='legacy'||!a.some((x,k)=>k!==i&&x.status===e.status&&x.date));
      if(!job[historyKey].length)job[historyKey]=[{status:job.status||'想投递',date:'',note:'',source:'legacy'}];
    }
    return job[historyKey];
  }
  function record(job,status,date=localDate(),note='',source='stage'){
    if(!job||!status)return;
    const hadHistory=Array.isArray(job[historyKey])&&job[historyKey].length>0;
    const history=ensure(job),last=history[history.length-1];
    if(!hadHistory||!last||last.status!==status)job.statusEnteredAt=Date.now();
    if(last&&last.status===status&&!last.date&&last.source==='legacy'){last.date=date||'';last.note=note||'';last.source=source;return;}
    if(last&&last.status===status&&last.date===date){
      if(note)last.note=note;
      return;
    }
    history.push({status,date:date||'',note:note||'',source});
  }
  function remove(job,index){
    const history=ensure(job);
    if(index>=0&&index<history.length)history.splice(index,1);
    if(!history.length)history.push({status:job.status||'想投递',date:'',note:'',source:'manual'});
  }
  function formatDate(value){
    if(!value)return '日期待补录';
    const parts=value.split('-');
    return parts.length===3?`${Number(parts[1])}/${Number(parts[2])}`:value;
  }
  function sorted(job){
    return ensure(job).map((entry,index)=>({...entry,index})).sort((a,b)=>{
      if(!a.date&&!b.date)return a.index-b.index;
      if(!a.date)return 1;
      if(!b.date)return -1;
      return a.date.localeCompare(b.date)||a.index-b.index;
    });
  }
  window.jobHistory={key:historyKey,today:localDate,ensure,record,remove,formatDate,sorted};

  function renderHistory(id){
    const job=jobs.find(x=>x.id===id),content=document.querySelector('#detail-content');
    if(!job||!content)return;
    const entries=sorted(job);
    const section=document.createElement('div');
    section.className='detail-section stage-history-section';
    section.innerHTML='<div class="detail-section-head"><h4>流程时间线</h4><button type="button" class="text-btn" data-add-stage-history>＋ 补录节点</button></div>'+
      '<div class="stage-history-list">'+entries.map(entry=>
        '<div class="stage-history-item"><span class="stage-history-dot"></span><div class="stage-history-main"><strong>'+escape(entry.status)+'</strong><small>'+escape(formatDate(entry.date))+'</small>'+(entry.note?'<p>'+escape(entry.note).replace(/\n/g,'<br>')+'</p>':'')+'</div><div class="stage-history-actions"><button type="button" class="text-btn" data-edit-stage-history="'+entry.index+'">编辑</button><button type="button" class="text-btn danger" data-delete-stage-history="'+entry.index+'">删除</button></div></div>'
      ).join('')+'</div>';
    const noteHeading=[...content.querySelectorAll('h4')].find(heading=>heading.textContent.trim()==='岗位备注');
    const noteSection=noteHeading&&noteHeading.closest('.detail-section');
    if(noteSection)noteSection.insertAdjacentElement('beforebegin',section);else content.append(section);
    section.querySelector('[data-add-stage-history]').onclick=e=>{e.stopPropagation();editHistory(job,null)};
    section.querySelectorAll('[data-edit-stage-history]').forEach(button=>button.onclick=e=>{e.stopPropagation();editHistory(job,Number(button.dataset.editStageHistory))});
    section.querySelectorAll('[data-delete-stage-history]').forEach(button=>button.onclick=e=>{e.stopPropagation();if(confirm('确定删除这个流程节点吗？')){remove(job,Number(button.dataset.deleteStageHistory));save();openJobDetail(job.id);render();showToast('流程节点已删除')}});
  }
  const baseOpenJobDetail=window.openJobDetail;
  if(typeof baseOpenJobDetail==='function'){
    window.openJobDetail=function(id){
      baseOpenJobDetail(id);
      renderHistory(id);
    };
  }
  function editHistory(job,index){
    const current=index===null?null:ensure(job)[index];if(index!==null&&!current)return;
    const modal=document.createElement('div');modal.className='stage-history-editor-backdrop';
    modal.innerHTML='<div class="stage-history-editor"><div class="modal-head"><h3>'+ (index===null?'补录流程节点':'编辑流程节点') +'</h3><button type="button" class="close-btn" data-close-stage-history>×</button></div><label>阶段<select data-stage-history-status>'+statuses.map(s=>'<option>'+escape(s)+'</option>').join('')+'</select></label><label>日期<input type="date" data-stage-history-date></label><label>备注<textarea data-stage-history-note placeholder="可记录测评、面试或挂岗原因等"></textarea></label><div class="form-actions"><button type="button" class="secondary-btn" data-close-stage-history>取消</button><button type="button" class="primary-btn" data-save-stage-history>保存</button></div></div>';
    document.body.appendChild(modal);
    const statusInput=modal.querySelector('[data-stage-history-status]'),dateInput=modal.querySelector('[data-stage-history-date]'),noteInput=modal.querySelector('[data-stage-history-note]');
    if(index===null){statusInput.value=job.status||'想投递';dateInput.value=localDate();}
    else{statusInput.value=current.status;dateInput.value=current.date;noteInput.value=current.note||'';}
    const close=()=>modal.remove();
    modal.querySelectorAll('[data-close-stage-history]').forEach(button=>button.onclick=close);
    modal.onclick=e=>{if(e.target===modal)close()};
    modal.querySelector('[data-save-stage-history]').onclick=()=>{
      const next={status:statusInput.value,date:dateInput.value,note:noteInput.value,source:'manual'};
      if(index===null)ensure(job).push(next);else ensure(job)[index]=next;
      save();close();openJobDetail(job.id);render();showToast('流程节点已保存');
    };
    statusInput.focus();
  }
  const style=document.createElement('style');
  style.textContent='.detail-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.stage-history-list{display:flex;flex-direction:column;gap:0;position:relative}.stage-history-item{position:relative;display:flex;align-items:flex-start;gap:12px;min-height:40px;padding:12px 0 16px 26px}.stage-history-item:not(:last-child)::before{content:"";position:absolute;z-index:0;left:4px;top:23px;bottom:-23px;width:2px;border-radius:2px;background:#d8d2fb}.stage-history-dot{position:absolute;z-index:1;left:0;top:18px;width:10px;height:10px;border-radius:50%;background:#7664e8;box-shadow:0 0 0 4px #f0edff}.stage-history-main{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:0 16px;min-width:0;flex:1}.stage-history-main strong{color:#26233b;font-size:13px}.stage-history-main small{color:#918ba4;font-size:12px;text-align:right;white-space:nowrap}.stage-history-main p{grid-column:1/-1;margin:5px 0 0;color:#77728a;font-size:12px;line-height:1.55;white-space:normal}.stage-history-actions{display:flex;gap:8px;flex-shrink:0}.stage-history-actions .text-btn{padding:0;font-size:12px}.stage-history-actions .danger{color:#c66}.stage-history-editor-backdrop{position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;padding:20px;background:#231f4366}.stage-history-editor{width:min(430px,calc(100vw - 40px));box-sizing:border-box;padding:22px;border-radius:16px;background:#fff;box-shadow:0 20px 60px #28235a33}.stage-history-editor label{display:block;margin-top:12px;color:#777;font-size:12px}.stage-history-editor input,.stage-history-editor select,.stage-history-editor textarea{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:10px;border:1px solid #e7e5f1;border-radius:8px;outline:0;font:13px inherit;color:#444;background:#fff}.stage-history-editor textarea{min-height:90px;resize:vertical}.stage-history-editor input:focus,.stage-history-editor select:focus,.stage-history-editor textarea:focus{border-color:#8d80eb}.stage-history-editor .form-actions{margin-top:16px}.stage-history-section{margin-top:18px}';
  document.head.appendChild(style);
})();
