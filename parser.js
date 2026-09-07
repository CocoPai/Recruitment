(function(){
  const form=$('#job-form');if(!form)return;
  const panel=document.createElement('div');
  panel.className='smart-import';
  const style=document.createElement('style');
  style.textContent='.modal-backdrop{overflow-y:auto;align-items:flex-start;padding:16px 0}.modal{max-height:calc(100vh - 32px);overflow-y:auto;margin:auto}.smart-import{background:#faf9ff;border:1px solid #ebe8ff;border-radius:12px;padding:14px;margin-bottom:16px}.smart-import-copy strong{display:block;color:#4e4b67;font-size:13px;margin-top:5px}.smart-import-copy p{color:#999;font-size:11px;margin:5px 0 10px}.smart-import textarea{height:80px;margin-top:0!important;background:#fff}.smart-import-actions{display:flex;align-items:center;gap:10px;margin-top:8px}.parse-status{color:#79a58a;font-size:11px}.job-url{margin-top:10px!important}.job-url a{color:#7161e8;text-decoration:none;font-weight:600}';
  document.head.appendChild(style);
  panel.innerHTML='<div class="smart-import-copy"><span class="section-kicker">SMART IMPORT</span><strong>粘贴岗位描述，自动识别</strong><p>支持从招聘网站复制整段 JD；识别后请检查并确认。</p></div><textarea id="jd-input" placeholder="把岗位详情页中的文字粘贴到这里……"></textarea><div class="smart-import-actions"><button type="button" class="outline-btn" id="parse-jd-btn">✦ 识别并填充</button><span class="parse-status" id="parse-status"></span></div>';
  form.insertBefore(panel,form.firstElementChild);
  const descLabel=document.createElement('label');
  descLabel.innerHTML='岗位描述<textarea name="description" placeholder="工作职责、工作内容、岗位目标……"></textarea>';
  const requirementField=form.querySelector('[name="requirements"]');
  if(requirementField&&requirementField.parentElement)requirementField.parentElement.parentElement.insertBefore(descLabel,requirementField.parentElement);
  const typeLabel=document.createElement('label');
  typeLabel.innerHTML='企业类型<select name="enterpriseType"><option value="">请选择企业类型</option><option value="国央企">国央企</option><option value="私企">私企</option><option value="外企">外企</option></select>';
  const cityField=form.querySelector('[name="city"]');
  if(cityField&&cityField.parentElement)cityField.parentElement.parentElement.insertBefore(typeLabel,cityField.parentElement.nextElementSibling);
  function find(pattern,text){const match=text.match(pattern);return match?match[1].trim():''}
  function parse(text){
    const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const result={};
    result.company=find(/(?:公司名称|公司|企业名称|招聘单位)[:：\s]+([^\n，,。；;]+)/i,text);
    result.role=find(/(?:职位名称|岗位名称|职位|岗位|招聘职位)[:：\s]+([^\n，,。；;]+)/i,text);
    result.city=find(/(?:工作地点|工作城市|地点|城市)[:：\s]+([^\n，,。；;]+)/i,text);
    result.salary=find(/(?:薪资范围|薪资|月薪|薪酬)[:：\s]+([^\n，,。；;]+)/i,text);
    result.education=find(/(?:学历要求|学历)[:：\s]+([^\n，,。；;]+)/i,text);
    result.enterpriseType=/央企|中央企业/.test(text)?'央企':(/国企|国有企业/.test(text)?'国企':(/私企|民营企业/.test(text)?'私企':(/外企|外资企业/.test(text)?'外企':'')));
    const reqIndex=lines.findIndex(x=>/^(岗位要求|任职要求|任职资格|职位要求|工作要求)[:：]?$/i.test(x));
    const dutyIndex=lines.findIndex(x=>/^(工作职责|岗位职责|职位描述|工作内容)[:：]?$/i.test(x));
    const dutyInline=text.match(/(?:工作职责|岗位职责|工作内容|岗位描述|职位描述)[:：]([\s\S]*?)(?=(?:任职要求|岗位要求|任职资格|职位要求)[:：]|$)/i);
    const reqInline=text.match(/(?:任职要求|岗位要求|任职资格|职位要求)[:：]([\s\S]*)/i);
    const blocks=[];
    if(dutyIndex>=0)blocks.push('工作职责：\n'+lines.slice(dutyIndex+1,reqIndex> dutyIndex?reqIndex:Math.min(lines.length,dutyIndex+8)).join('\n'));
    if(reqIndex>=0)blocks.push('任职要求：\n'+lines.slice(reqIndex+1,Math.min(lines.length,reqIndex+10)).join('\n'));
    result.description=dutyIndex>=0?lines.slice(dutyIndex+1,reqIndex> dutyIndex?reqIndex:Math.min(lines.length,dutyIndex+8)).join('\n'):(dutyInline?dutyInline[1].trim():'');
    result.requirements=reqIndex>=0?lines.slice(reqIndex+1,Math.min(lines.length,reqIndex+10)).join('\n'):(reqInline?reqInline[1].trim():'');
    if(!result.description&&lines.length>1){
      const fallbackCount=Math.max(1,Math.min(5,Math.ceil(lines.length/3)));
      result.description=lines.slice(0,fallbackCount).join('\n');
    }
    if(!result.requirements){
      const keywords=['本科','硕士','经验','负责','熟悉','要求','能力','技能','优先'];
      const candidates=lines.filter(x=>keywords.some(k=>x.includes(k))).slice(0,12);
      result.requirements=candidates.join('\n');
    }
    result.raw=text;
    return result;
  }
  function fill(name,value){const input=form[name];if(input&&value)input.value=value}
  $('#parse-jd-btn').addEventListener('click',()=>{
    const text=$('#jd-input').value.trim(),status=$('#parse-status');
    if(!text){status.textContent='请先粘贴岗位描述';return}
    const data=parse(text);
    fill('company',data.company);fill('role',data.role);fill('city',data.city);fill('enterpriseType',data.enterpriseType);fill('description',data.description);fill('requirements',data.requirements);
    if(data.salary||data.education)fill('notes',[data.salary&&'薪资：'+data.salary,data.education&&'学历：'+data.education].filter(Boolean).join('\n'));
    status.textContent='已识别，请检查表单内容';
    if(!data.company&&!data.role&&!data.requirements)status.textContent='未识别到明显字段，请检查文本格式';
  });
  $('#add-btn').addEventListener('click',()=>{setTimeout(()=>{$('#jd-input').value='';$('#parse-status').textContent=''},0)});
})();
