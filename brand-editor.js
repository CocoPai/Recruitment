(function () {
  function enableBrandEdit(element, storageKey) {
    if (!element) return;
    const fallback = element.textContent.trim();
    element.textContent = localStorage.getItem(storageKey) || fallback;
    element.classList.add('brand-editable');
    element.title = '点击修改';
    let previousValue = element.textContent;
    let cancelled = false;

    element.addEventListener('click', function () {
      if (element.isContentEditable) return;
      previousValue = element.textContent;
      cancelled = false;
      element.contentEditable = 'true';
      element.classList.add('is-editing');
      element.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    });

    element.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        element.blur();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelled = true;
        element.textContent = previousValue;
        element.blur();
      }
    });

    element.addEventListener('blur', function () {
      element.contentEditable = 'false';
      element.classList.remove('is-editing');
      if (cancelled) return;
      const value = element.textContent.trim() || fallback;
      element.textContent = value;
      localStorage.setItem(storageKey, value);
      if (typeof showToast === 'function') showToast('名称已保存');
    });
  }

  enableBrandEdit(document.querySelector('.brand strong'), 'recruitment-brand-name');
  enableBrandEdit(document.querySelector('.brand small'), 'recruitment-brand-subtitle');

  const style = document.createElement('style');
  style.textContent = '.brand-editable{border-radius:5px;cursor:text;outline:0;transition:background .18s ease,box-shadow .18s ease}.brand-editable:hover{background:#f3f1ff;box-shadow:0 0 0 4px #f3f1ff}.brand-editable.is-editing{background:#fff;box-shadow:0 0 0 2px #bdb5f6;padding:1px 3px}';
  document.head.appendChild(style);
})();
