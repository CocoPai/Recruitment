(function () {
  const companyOrderStorageKey = 'recruitment-company-order-v1';

  function normalizedCompany(job) {
    return (job.company || '').trim().toLocaleLowerCase('zh-CN');
  }

  function companyKey(company) {
    return encodeURIComponent((company || '').trim().toLocaleLowerCase('zh-CN'));
  }

  function readCompanyOrder() {
    try {
      const value = JSON.parse(localStorage.getItem(companyOrderStorageKey) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch (error) {
      return {};
    }
  }

  function saveCompanyOrder(status, keys) {
    const value = readCompanyOrder();
    value[status] = [...new Set(keys.filter(Boolean))];
    localStorage.setItem(companyOrderStorageKey, JSON.stringify(value));
  }

  function applyCompanyOrder(status, groups) {
    const savedKeys = readCompanyOrder()[status] || [];
    if (!savedKeys.length) return groups;
    const position = new Map(savedKeys.map((key, index) => [key, index]));
    return groups
      .map((group, index) => ({ group, index, savedIndex: position.get(companyKey(group.company)) }))
      .sort((a, b) => {
        const aSaved = a.savedIndex !== undefined;
        const bSaved = b.savedIndex !== undefined;
        if (aSaved && bSaved) return a.savedIndex - b.savedIndex;
        if (aSaved) return -1;
        if (bSaved) return 1;
        return a.index - b.index;
      })
      .map(item => item.group);
  }

  function statusEnteredAt(job) {
    const preciseTime = Number(job.statusEnteredAt);
    if (Number.isFinite(preciseTime) && preciseTime > 0) return preciseTime;
    const history = Array.isArray(job.stageHistory) ? job.stageHistory : [];
    const currentEntries = history.filter(entry => entry && entry.status === job.status && entry.date);
    const latest = currentEntries[currentEntries.length - 1];
    if (!latest) return null;
    const parsed = Date.parse(latest.date + 'T00:00:00');
    return Number.isNaN(parsed) ? null : parsed;
  }

  function renderRole(job) {
    const location = (job.city || '').trim() || '地址待补充';
    const roleName = escapeHtml(job.role || '未填写岗位');
    return '<div class="job-card company-role-row" data-edit="' + job.id + '">' +
      '<div class="company-role-main">' +
      '<strong class="company-role-name">' + roleName + '</strong>' +
      '<span class="company-role-location">' + escapeHtml(location) + '</span>' +
      '<span class="company-role-tooltip" role="tooltip" aria-hidden="true">' + roleName + '</span>' +
      '</div>' +
      '<span class="status-chip intent-' + intentClass(job.priority) + '">' + escapeHtml(job.priority || '未标注') + '</span>' +
      '</div>';
  }

  function renderCompanyGroup(group) {
    const typeJob = group.jobs.find(job => enterpriseTypeLabel(job) !== '未标注') || group.jobs[0];
    return '<article class="company-group-card" data-company-key="' + companyKey(group.company) + '">' +
      '<header class="company-card-header"><strong>' + escapeHtml(group.company) + '</strong>' +
      '<span class="enterprise-type-chip enterprise-' + enterpriseTypeClass(typeJob) + '">' + escapeHtml(enterpriseTypeLabel(typeJob)) + '</span></header>' +
      '<div class="company-role-list">' + group.jobs.map(renderRole).join('') + '</div></article>';
  }

  function groupsForStatus(items, status) {
    const map = new Map();
    const orderedJobs = items
      .map((job, index) => ({ job, index, enteredAt: statusEnteredAt(job) }))
      .filter(item => item.job.status === status)
      .sort((a, b) => {
        if (a.enteredAt === null && b.enteredAt === null) return a.index - b.index;
        if (a.enteredAt === null) return -1;
        if (b.enteredAt === null) return 1;
        return a.enteredAt - b.enteredAt || a.index - b.index;
      });
    orderedJobs.forEach(({ job }) => {
      const key = normalizedCompany(job);
      if (!map.has(key)) map.set(key, { company: (job.company || '').trim(), jobs: [] });
      map.get(key).jobs.push(job);
    });
    return Array.from(map.values());
  }

  function renderGroupedBoard() {
    const board = document.querySelector('#board');
    const pills = document.querySelector('#filter-pills');
    if (!board || !pills) return;

    const query = (document.querySelector('#search-input')?.value || '').trim().toLocaleLowerCase('zh-CN');
    const visibleJobs = jobs.filter(job => {
      const matchesStatus = filter === '全部' || job.status === filter;
      const searchable = ((job.company || '') + (job.role || '') + (job.city || '')).toLocaleLowerCase('zh-CN');
      return matchesStatus && searchable.includes(query);
    });
    const visibleStatuses = filter === '全部' ? statuses : [filter];

    pills.innerHTML = ['全部', ...statuses].map(status =>
      '<button class="filter-pill ' + (filter === status ? 'active' : '') + '" data-filter="' + status + '">' + status + '</button>'
    ).join('');

    board.innerHTML = visibleStatuses.map(status => {
      const groups = applyCompanyOrder(status, groupsForStatus(visibleJobs, status));
      const count = groups.reduce((sum, group) => sum + group.jobs.length, 0);
      return '<section class="board-column stage-row" data-status="' + status + '">' +
        '<div class="column-head"><span>' + status + '</span><span class="column-count">' + count + '</span></div>' +
        '<div class="company-groups">' +
        (groups.length ? groups.map(renderCompanyGroup).join('') : '<div class="stage-empty">拖动岗位到这里</div>') +
        '</div></section>';
    }).join('');
  }

  window.renderBoard = renderGroupedBoard;
  window.companyBoardOrder = { save: saveCompanyOrder };
  document.querySelector('#search-input')?.addEventListener('input', renderGroupedBoard);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-filter]')) setTimeout(renderGroupedBoard, 0);
  });
  renderGroupedBoard();
})();
