(function () {
  function dateKey(offset) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function storedEvents() {
    try {
      return JSON.parse(localStorage.getItem('recruitment-events') || '[]');
    } catch (_) {
      return [];
    }
  }

  window.renderUpcoming = function () {
    const list = document.querySelector('#upcoming-list');
    if (!list) return;

    const today = dateKey(0);
    const tomorrow = dateKey(1);
    const wantedDates = new Set([today, tomorrow]);
    const currentJobs = typeof jobs === 'undefined' ? [] : jobs;
    const currentInterviews = typeof interviews === 'undefined' ? [] : interviews;

    const interviewItems = currentInterviews.filter(item => wantedDates.has(item.date)).map(item => {
      const job = currentJobs.find(candidate => candidate.id === Number(item.jobId)) || {};
      return {
        id: item.id,
        source: 'interview',
        date: item.date,
        title: (job.company || '未关联企业') + ' · ' + (item.round || '面试'),
        detail: [job.role, item.type].filter(Boolean).join(' · ')
      };
    });

    const eventItems = storedEvents().filter(item => wantedDates.has(item.date)).map(item => {
      const job = currentJobs.find(candidate => candidate.id === Number(item.jobId));
      return {
        id: item.id,
        source: 'event',
        date: item.date,
        title: item.title || item.type || '未命名事件',
        detail: [item.type, job && job.company, job && job.role].filter(Boolean).join(' · ')
      };
    });

    const items = interviewItems.concat(eventItems).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'zh-CN'));
    list.innerHTML = items.length ? items.map(item => {
      const day = Number(item.date.slice(8));
      const label = item.date === today ? '今天' : '明天';
      return '<div class="interview-row timeline-item overview-schedule-item" data-schedule-kind="' + item.source + '" data-schedule-id="' + item.id + '" title="点击查看详情"><div class="date-block"><b>' + day + '</b><small>' + label + '</small></div><div class="interview-info"><strong>' + escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.detail) + '</p></div><span class="timeline-edit-hint">›</span></div>';
    }).join('') : '<div class="empty">今天和明天暂无日程。</div>';
  };

  const scheduleApi = window.recruitmentEvents;
  if (scheduleApi && typeof scheduleApi.save === 'function') {
    const originalSave = scheduleApi.save;
    scheduleApi.save = function () {
      const result = originalSave.apply(this, arguments);
      window.renderUpcoming();
      return result;
    };
  }

  window.addEventListener('storage', window.renderUpcoming);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) window.renderUpcoming();
  });
  window.renderUpcoming();
})();
