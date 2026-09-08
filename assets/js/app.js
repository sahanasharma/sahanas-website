/* Shared, dependency-free interactions. The index is local and works on file://. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const safeGet = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) { /* Storage is optional. */ } };
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = $('#motion-toggle');
  let motionEnabled = !motionQuery.matches && safeGet('sahana-motion') !== 'off';
  function applyMotion() {
    document.documentElement.dataset.motion = motionEnabled ? 'on' : 'off';
    if (motionButton) {
      motionButton.textContent = motionQuery.matches ? 'Motion: reduced' : `Motion: ${motionEnabled ? 'on' : 'off'}`;
      motionButton.setAttribute('aria-pressed', String(!motionEnabled));
      motionButton.disabled = motionQuery.matches;
      motionButton.title = motionQuery.matches ? 'Your device requests reduced motion.' : 'Turn decorative motion on or off.';
    }
  }
  applyMotion();
  motionButton?.addEventListener('click', () => { motionEnabled = !motionEnabled; safeSet('sahana-motion', motionEnabled ? 'on' : 'off'); applyMotion(); });
  motionQuery.addEventListener?.('change', () => { motionEnabled = !motionQuery.matches && safeGet('sahana-motion') !== 'off'; applyMotion(); });

  const menuButton = $('.menu-toggle');
  const nav = $('#site-nav');
  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    nav?.classList.toggle('open', isOpen);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
      menuButton.click(); menuButton.focus();
    }
  });

  let readingFrame = false;
  function updateReadingProgress() {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = height > 0 ? Math.max(0, Math.min(100, window.scrollY / height * 100)) : 100;
    const bar = $('#reading-progress');
    if (bar) bar.style.width = `${percentage.toFixed(2)}%`;
    readingFrame = false;
  }
  window.addEventListener('scroll', () => {
    if (!readingFrame) { readingFrame = true; requestAnimationFrame(updateReadingProgress); }
  }, { passive: true });
  window.addEventListener('resize', updateReadingProgress, { passive: true });
  updateReadingProgress();

  const filterButtons = $$('[data-learning-filter]');
  function filterLearning(filter) {
    let count = 0;
    $$('[data-learning-section]').forEach(section => {
      const show = filter === 'all' || section.dataset.learningSection === filter;
      section.hidden = !show;
      if (show) count += section.querySelectorAll('[data-index-title]').length;
    });
    filterButtons.forEach(button => {
      const selected = button.dataset.learningFilter === filter;
      button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected));
    });
    const status = $('#filter-status');
    if (status) status.textContent = `${count} learning entries shown. All entries remain available through site-wide search.`;
    updateReadingProgress();
  }
  filterButtons.forEach(button => button.addEventListener('click', () => filterLearning(button.dataset.learningFilter)));

  function revealHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    if (!id) return;
    const isHome = /(?:^|\/)index\.html$/.test(location.pathname) || location.pathname.endsWith('/');
    const legacy = { research: 'research.html', projects: 'projects.html', learning: 'co-curriculars.html', experience: 'experience.html', education: 'education.html', skills: 'skills.html', 'passion-project': 'passion-project.html' };
    if (isHome && legacy[id]) { location.replace(legacy[id]); return; }
    const target = document.getElementById(id);
    if (!target) return;
    if (target.closest('[data-learning-section]')) filterLearning('all');
    let node = target;
    while (node && node !== document.body) { if (node.tagName === 'DETAILS') node.open = true; node = node.parentElement; }
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
      if (!['top', 'main'].includes(id)) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.classList.add('target-found');
        setTimeout(() => target.classList.remove('target-found'), 2600);
      }
      updateReadingProgress();
    });
  }
  window.addEventListener('hashchange', revealHash);
  window.addEventListener('load', revealHash, { once: true });

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); reveal.unobserve(entry.target); }
      });
    }, { threshold: .08 });
    $$('.path-card, .feature-card, .research-card, .project-feature, .experience-content, .education-main').forEach(element => reveal.observe(element));
    const tocLinks = $$('.article-toc a');
    const toc = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) tocLinks.forEach(a => a.classList.toggle('toc-active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-155px 0px -55% 0px', threshold: 0 });
    tocLinks.forEach(a => { const section = $(a.getAttribute('href')); if (section) toc.observe(section); });
  }

  const searchDialog = $('#search-dialog');
  const certificateDialog = $('#certificate-dialog');
  let lastDialogTrigger = null;
  function openDialog(dialog, trigger) {
    if (!dialog || dialog.open) return;
    if (searchDialog?.open) searchDialog.close();
    if (certificateDialog?.open) certificateDialog.close();
    lastDialogTrigger = trigger || document.activeElement;
    dialog.showModal(); document.body.classList.add('modal-open');
  }
  [searchDialog, certificateDialog].filter(Boolean).forEach(dialog => {
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
    });
    dialog.addEventListener('close', () => {
      if (!$('dialog[open]')) document.body.classList.remove('modal-open');
      const trigger = lastDialogTrigger;
      if (trigger instanceof HTMLElement && document.contains(trigger)) trigger.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    $$('[data-dialog-close]', dialog).forEach(button => button.addEventListener('click', () => dialog.close()));
  });
  $$('[data-certificate-preview]').forEach(button => button.addEventListener('click', () => {
    const image = $('#certificate-image');
    const original = $('#certificate-original');
    const title = button.dataset.title || 'Certificate';
    $('#certificate-title').textContent = title;
    image.src = button.dataset.certificatePreview;
    image.alt = `${title}: preview of the supplied certificate`;
    original.href = button.dataset.original;
    openDialog(certificateDialog, button);
  }));

  /* Normalise once per indexed item. Query evaluation does not scan the DOM. */
  const normalise = value => String(value || '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/(\d),(?=\d{3}(?:\D|$))/g, '$1')
    .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text => normalise(text).split(' ').filter(Boolean);
  const stopWords = new Set(['a', 'an', 'the', 'of', 'and', 'or', 'for', 'to', 'in', 'on', 'my', 'with', 'at', 'about']);
  const aliases = {
    ai: ['artificial', 'intelligence', 'agentic', 'attention'],
    ml: ['machine', 'learning', 'algoverse'],
    stats: ['statistics', 'statistical', 'quantitative', 'quantification'],
    stat: ['statistics', 'statistical'],
    math: ['mathematics', 'mathematical', 'maths'],
    maths: ['mathematics', 'mathematical', 'math'],
    mr: ['marginal', 'revenue'],
    econ: ['economics', 'econometrics'],
    sql: ['relational', 'database', 'databases'],
    database: ['sql', 'relational', 'databases'],
    internship: ['intern', 'dental', 'b9'],
    intern: ['internship', 'dental', 'b9'],
    certificate: ['certificates', 'credential', 'credentials'],
    certificates: ['certificate', 'credential', 'credentials'],
    credential: ['credentials', 'certificate', 'certificates'],
    cocurriculars: ['curriculars', 'learning', 'programmes'],
    extracurriculars: ['curriculars', 'learning', 'programmes'],
    cocurricular: ['curriculars', 'learning'],
    optimize: ['optimisation', 'optimiser', 'optimise'],
    optimization: ['optimisation', 'optimiser'],
    digitization: ['digitisation', 'digitised'],
    courses: ['course', 'programmes', 'programme'],
    programs: ['programmes', 'programme'],
    program: ['programme', 'programmes'],
    programme: ['programmes', 'course'],
    nusefmc: ['nefmc', 'economics', 'financial'],
    ywait: ['younnovate'],
    programmes: ['programme', 'course']
  };
  const sourceIndex = Array.isArray(window.PORTFOLIO_INDEX) ? window.PORTFOLIO_INDEX : [];
  const searchIndex = sourceIndex.map((item, order) => {
    const title = normalise(item.title);
    const keywords = normalise(`${item.keywords || ''} ${item.category || ''}`);
    const body = normalise(item.text);
    return { ...item, order, titleNormal: title, keywordsNormal: keywords, bodyNormal: body,
      titleWords: new Set(title.split(' ')), keywordWords: new Set(keywords.split(' ')), bodyWords: new Set(body.split(' ')),
      fuzzyWords: Array.from(new Set(`${title} ${keywords}`.split(' '))).filter(w => w.length >= 3) };
  });
  function editDistanceAtMost(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const current = [i]; let rowMin = i;
      for (let j = 1; j <= b.length; j++) {
        current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        rowMin = Math.min(rowMin, current[j]);
      }
      if (rowMin > max) return max + 1;
      previous = current;
    }
    return previous[b.length];
  }
  const prefixIn = (set, term) => term.length >= 3 && Array.from(set).some(word => word.startsWith(term));
  function termScore(item, term) {
    if (item.titleWords.has(term)) return 52;
    if (prefixIn(item.titleWords, term)) return 37;
    if (item.keywordWords.has(term)) return 24;
    if (item.bodyWords.has(term)) return 10;
    if (prefixIn(item.keywordWords, term)) return 15;
    if (term.length >= 4 && prefixIn(item.bodyWords, term)) return 5;
    let variants = aliases[term] || [];
    if (term.endsWith('s') && term.length > 4) variants = [...variants, term.slice(0, -1)];
    else if (term.length > 3) variants = [...variants, `${term}s`];
    for (const variant of variants) {
      if (item.titleWords.has(variant)) return 25;
      if (item.keywordWords.has(variant)) return 13;
      if (item.bodyWords.has(variant)) return 4;
    }
    if (term.length >= 4) {
      const max = term.length >= 8 ? 2 : 1;
      if (Array.from(item.titleWords).some(word => word.length >= 3 && editDistanceAtMost(term, word, max) <= max)) return 14;
      if (item.fuzzyWords.some(word => editDistanceAtMost(term, word, max) <= max)) return 6;
    }
    return 0;
  }
  function rankSearch(rawQuery) {
    const query = normalise(String(rawQuery).slice(0, 160));
    if (!query) return [];
    let terms = Array.from(new Set(query.split(' ').filter(word => !stopWords.has(word) && (word.length > 1 || /^\d$/.test(word))))).slice(0, 10);
    if (!terms.length) terms = query.split(' ').slice(0, 10);
    const scored = [];
    for (const item of searchIndex) {
      let score = 0, matched = 0;
      for (const term of terms) { const points = termScore(item, term); if (points > 0) { matched++; score += points; } }
      if (!matched) continue;
      if (item.titleNormal === query) score += 900;
      else if (item.titleNormal.startsWith(`${query} `)) score += 240;
      else if (` ${item.titleNormal} `.includes(` ${query} `)) score += 145;
      if (` ${item.keywordsNormal} `.includes(` ${query} `)) score += 35;
      if (terms.length > 1 && item.bodyNormal.includes(query)) score += 25;
      score += matched === terms.length ? 100 : -(terms.length - matched) * 38;
      if (item.category === 'Pages' && item.titleNormal === query) score += 80;
      scored.push({ item, score, matched, complete: matched === terms.length });
    }
    const complete = scored.filter(result => result.complete);
    const eligible = complete.length ? complete : scored.filter(result => result.matched >= Math.ceil(terms.length * .65));
    return eligible.sort((a, b) => b.score - a.score || a.item.title.length - b.item.title.length || a.item.order - b.item.order);
  }
  // Exposed for repeatable, local tests and future maintenance.
  window.PortfolioSearch = Object.freeze({
    find: query => rankSearch(query).map(({ item, score }) => ({ title: item.title, url: item.url, category: item.category, score })),
    count: searchIndex.length
  });

  const searchInput = $('#global-search');
  const resultContainer = $('#search-results');
  const suggestions = $('#search-suggestions');
  const status = $('#search-status');
  const timing = $('#search-timing');
  let inputTimer = 0, activeIndex = -1, currentResults = [], lastQuery = null;
  searchInput?.setAttribute('role', 'combobox');
  searchInput?.setAttribute('aria-autocomplete', 'list');
  searchInput?.setAttribute('aria-expanded', 'false');
  resultContainer?.setAttribute('role', 'listbox');
  resultContainer?.setAttribute('aria-label', 'Search results');

  function appendHighlighted(element, text, query) {
    const terms = words(query).filter(term => term.length >= 2).sort((a, b) => b.length - a.length);
    if (!terms.length) { element.textContent = text; return; }
    const escapeRE = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const expression = new RegExp(`\\b(${terms.map(escapeRE).join('|')})`, 'gi');
    let cursor = 0, match;
    while ((match = expression.exec(text)) !== null) {
      element.append(document.createTextNode(text.slice(cursor, match.index)));
      const mark = document.createElement('mark'); mark.textContent = match[0]; element.append(mark);
      cursor = match.index + match[0].length;
    }
    element.append(document.createTextNode(text.slice(cursor)));
  }
  function snippetFor(item, query) {
    const text = (item.text || '').replace(/\s+/g, ' ').trim();
    const queryWords = words(query).filter(word => word.length >= 3 && !stopWords.has(word));
    let matchAt = -1;
    const lower = text.toLowerCase();
    for (const word of queryWords) { const at = lower.indexOf(word); if (at >= 0 && (matchAt < 0 || at < matchAt)) matchAt = at; }
    let start = matchAt > 95 ? Math.max(0, matchAt - 60) : 0;
    if (start > 0) { const space = text.indexOf(' ', start); if (space >= 0) start = space + 1; }
    const excerpt = text.slice(start, start + 200);
    return `${start > 0 ? '… ' : ''}${excerpt}${text.length > start + 200 ? '…' : ''}`;
  }
  function setActive(index, scroll = false) {
    const anchors = $$('.search-result', resultContainer);
    if (!anchors.length) { activeIndex = -1; searchInput.removeAttribute('aria-activedescendant'); return; }
    activeIndex = (index + anchors.length) % anchors.length;
    anchors.forEach((anchor, i) => { const active = i === activeIndex; anchor.classList.toggle('is-active', active); anchor.setAttribute('aria-selected', String(active)); });
    searchInput.setAttribute('aria-activedescendant', anchors[activeIndex].id);
    if (scroll) anchors[activeIndex].scrollIntoView({ block: 'nearest' });
  }
  function runSearch(force = false) {
    clearTimeout(inputTimer); inputTimer = 0;
    const rawQuery = searchInput.value.trim();
    if (!force && rawQuery === lastQuery) return;
    lastQuery = rawQuery;
    const started = performance.now();
    resultContainer.replaceChildren(); currentResults = []; activeIndex = -1;
    searchInput.removeAttribute('aria-activedescendant');
    if (!normalise(rawQuery)) {
      suggestions.hidden = false; timing.textContent = `${searchIndex.length} indexed entries`;
      status.textContent = 'Enter a topic to search all portfolio pages.';
      searchInput.setAttribute('aria-expanded', 'false'); return;
    }
    suggestions.hidden = true;
    const ranked = rankSearch(rawQuery);
    currentResults = ranked.slice(0, 12).map(result => result.item);
    searchInput.setAttribute('aria-expanded', String(currentResults.length > 0));
    if (!ranked.length) {
      const empty = document.createElement('div'); empty.className = 'search-empty';
      const heading = document.createElement('h3'); heading.textContent = 'No matches just yet.';
      const description = document.createElement('p'); description.textContent = `Nothing matched “${rawQuery}”. Try fewer words, a programme name or a skill such as SQL.`;
      empty.append(heading, description); resultContainer.append(empty);
      status.textContent = `No results for ${rawQuery}.`;
    } else {
      currentResults.forEach((item, index) => {
        const anchor = document.createElement('a');
        anchor.className = 'search-result'; anchor.href = item.url; anchor.id = `search-option-${index}`;
        anchor.setAttribute('role', 'option'); anchor.setAttribute('aria-selected', 'false'); anchor.tabIndex = -1;
        const meta = document.createElement('div'); meta.className = 'result-meta';
        const category = document.createElement('span'); category.textContent = item.category;
        const arrow = document.createElement('span'); arrow.textContent = 'Open ↗'; arrow.setAttribute('aria-hidden', 'true'); meta.append(category, arrow);
        const title = document.createElement('div'); title.className = 'result-title'; appendHighlighted(title, item.title, rawQuery);
        const snippet = document.createElement('p'); snippet.className = 'result-snippet'; appendHighlighted(snippet, snippetFor(item, rawQuery), rawQuery);
        anchor.append(meta, title, snippet);
        anchor.addEventListener('pointermove', () => setActive(index));
        anchor.addEventListener('click', () => searchDialog.close());
        resultContainer.append(anchor);
      });
      status.textContent = `Showing ${currentResults.length} of ${ranked.length} matching entries. Use arrow keys and Enter to open a result.`;
    }
    const elapsed = performance.now() - started;
    timing.textContent = ranked.length ? `${ranked.length} ${ranked.length === 1 ? 'match' : 'matches'} · ${Math.max(1, Math.round(elapsed))} ms` : 'Try a different topic';
    resultContainer.scrollTop = 0;
  }
  function openSearch(trigger) {
    const focusTarget = trigger instanceof HTMLElement && trigger.matches('button, a[href], input, textarea, select, [tabindex]')
      ? trigger : $('[data-search-open]');
    openDialog(searchDialog, focusTarget); runSearch(true);
    requestAnimationFrame(() => { searchInput.focus(); searchInput.select(); });
  }
  $$('[data-search-open]').forEach(button => button.addEventListener('click', () => openSearch(button)));
  searchInput?.addEventListener('input', () => { clearTimeout(inputTimer); inputTimer = setTimeout(() => runSearch(), 75); });
  searchInput?.addEventListener('search', () => runSearch());
  searchInput?.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) runSearch();
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(activeIndex + 1, true); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(activeIndex < 0 ? currentResults.length - 1 : activeIndex - 1, true); }
    else if (event.key === 'Enter' && currentResults.length) {
      event.preventDefault(); const selected = currentResults[Math.max(0, activeIndex)];
      searchDialog.close(); location.href = selected.url;
    }
  });
  $$('[data-query]').forEach(button => button.addEventListener('click', () => { searchInput.value = button.dataset.query; runSearch(true); searchInput.focus(); }));
  document.addEventListener('keydown', event => {
    const target = event.target;
    const isEditing = target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(target); }
    else if (event.key === '/' && !isEditing && !$('dialog[open]')) { event.preventDefault(); openSearch(target); }
  });
  document.addEventListener('toggle', () => requestAnimationFrame(updateReadingProgress), true);
})();
