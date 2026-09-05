(function(){const placeholderTaskTitles=new Set(['完成美团在线测评','准备小红书一面案例','复盘阿里二面问题']);interviews=interviews.filter(i=>jobs.some(j=>j.id===i.jobId)||!(i.date==='2026-09-08'&&i.round==='一面'&&i.type==='视频面试'));const placeholderInterviews=[['2026-09-08','一面','重点准备社区产品案例'],['2026-09-12','二面','准备业务理解']];tasks=tasks.filter(t=>!placeholderTaskTitles.has(t.title));interviews=interviews.filter(i=>!placeholderInterviews.some(x=>i.date===x[0]&&i.round===x[1]&&i.note===x[2]));save();render();
  const migration={'测评':'已测评','笔试':'已笔试','一面':'已一面','二面':'已二面','终面':'已终面'};const intentMigration={'高':'梦中情岗','中':'真想去','低':'随便投投'};
  let changed=false;
  jobs=jobs.map(j=>{const next=migration[j.status]||j.status;const priority=intentMigration[j.priority]||j.priority||'真想去';if(next!==j.status||!j.priority){changed=true;return {...j,status:next,priority}}return j});
  if(changed){save();render()}
  const style=document.createElement('style');
  style.textContent='.board-column.drag-over{background:#e9e5ff;outline:2px dashed #9b8ff2;outline-offset:-3px}.job-card[draggable=true]{cursor:grab}.job-card.dragging{opacity:.45;transform:scale(.98)}.drag-hint{font-size:11px;color:#a5a3b2;margin-left:10px}';
  document.head.appendChild(style);
  function decorate(){
    document.querySelectorAll('.board-column').forEach(column=>{
      const title=column.querySelector('.column-head span');if(!title)return;
      const status=title.textContent.trim();column.dataset.status=status;
      if(!column.dataset.dragReady){
        column.dataset.dragReady='1';
        column.addEventListener('dragover',e=>{e.preventDefault();column.classList.add('drag-over')});
        column.addEventListener('dragleave',()=>column.classList.remove('drag-over'));
        column.addEventListener('drop',e=>{
          e.preventDefault();column.classList.remove('drag-over');
          const id=Number(e.dataTransfer.getData('text/plain')),job=jobs.find(j=>j.id===id);
          if(!job||!statuses.includes(column.dataset.status))return;
          job.status=column.dataset.status;save();render();refreshOverviewFromData();showToast('岗位已移动到：'+job.status);
        });
      }
    });
    document.querySelectorAll('.job-card[data-edit]').forEach(card=>{
      card.draggable=true;
      if(card.dataset.dragReady)return;
      card.dataset.dragReady='1';
      card.addEventListener('dragstart',e=>{card.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',card.dataset.edit)});
      card.addEventListener('dragend',()=>card.classList.remove('dragging'));
    });
  }
  const board=$('#board');if(board)new MutationObserver(()=>setTimeout(decorate,0)).observe(board,{childList:true,subtree:true});
  decorate();
})();
