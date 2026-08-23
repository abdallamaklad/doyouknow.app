/* ============================================
   doyouknow.app — Site Scripts
   Dark mode, mobile menu, share, FAQ, lazy load
   ============================================ */

(function() {
    'use strict';

    // --- GA4 Helpers ---
    function sendGA4Event(eventName, params) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params || {});
        } else {
            console.log('[GA4]', eventName, params || {});
        }
    }

    function getArticleSlug() {
        var canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            var url = canonical.href;
            var match = url.match(/\/article\/([^/]+)(?:\.html)?$/);
            if (match) return match[1];
        }
        var path = window.location.pathname;
        var match = path.match(/\/article\/([^/]+)(?:\.html)?$/);
        if (match) return match[1];
        return path.replace(/^\//, '').replace(/\.html$/, '') || 'home';
    }

    function getArticleTitle() {
        var h1 = document.querySelector('article h1, .article-header h1, h1');
        if (h1) return h1.textContent.trim();
        return document.title.split(' | ')[0].trim();
    }

    function getArticleCategory() {
        var badge = document.querySelector('.category-badge a, .category-badge');
        if (badge) {
            var text = badge.textContent.trim();
            if (text) return text;
        }
        var breadcrumb = document.querySelector('.breadcrumb li:nth-child(2) a');
        if (breadcrumb) return breadcrumb.textContent.trim();
        return '';
    }

    function getPageInfo() {
        var isArticle = !!document.querySelector('.article-body');
        var slug = getArticleSlug();
        var title = getArticleTitle();
        var category = getArticleCategory();
        var lang = document.documentElement.lang || 'en';
        return {
            isArticle: isArticle,
            articleId: slug,
            articleTitle: title,
            articleCategory: category,
            language: lang,
            contentType: isArticle ? 'article' : 'page'
        };
    }

    // --- Dark Mode ---
    const STORAGE_KEY = 'dyk-theme';
    const PREFERS_DARK = window.matchMedia('(prefers-color-scheme: dark)');
    const html = document.documentElement;

    function getTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;
        return PREFERS_DARK.matches ? 'dark' : 'light';
    }

    // Keep theme setup idempotent. Static pages can be re-evaluated during
    // hydration/navigation; registering another handler would double-track a
    // single user action.
    const themeRuntime = window.__DYK_THEME_RUNTIME__ || (window.__DYK_THEME_RUNTIME__ = {
        initialized: false,
        toggleBound: false,
        preferenceBound: false
    });

    function applyTheme(theme, options) {
        const track = options && options.track === true;
        html.setAttribute('data-theme', theme);
        const btn = document.querySelector('.theme-toggle');
        if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        if (track) {
            sendGA4Event('dark_mode_toggle', {
                theme: theme,
                method: options.method
            });
        }
    }

    function setTheme(theme, method) {
        const current = html.getAttribute('data-theme');
        localStorage.setItem(STORAGE_KEY, theme);
        applyTheme(theme, {
            track: themeRuntime.initialized && current !== theme,
            method: method || 'user_toggle'
        });
    }

    // Initialization, persisted-preference restoration, and the initial
    // system preference lookup are state changes—not user interactions.
    applyTheme(getTheme(), { track: false });
    themeRuntime.initialized = true;

    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle && !themeRuntime.toggleBound) {
        themeToggle.addEventListener('click', function() {
            const current = html.getAttribute('data-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
        themeRuntime.toggleBound = true;
    }

    if (!themeRuntime.preferenceBound) {
        PREFERS_DARK.addEventListener('change', function(e) {
            if (!localStorage.getItem(STORAGE_KEY)) {
                setTheme(e.matches ? 'dark' : 'light', 'system_preference');
            }
        });
        themeRuntime.preferenceBound = true;
    }

    // --- Mobile Menu ---
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const overlay = document.querySelector('.mobile-nav-overlay');
    const closeBtn = document.querySelector('.mobile-nav-close');

    function openMenu() {
        mobileNav?.classList.add('active');
        overlay?.classList.add('active');
        menuBtn?.setAttribute('aria-expanded', 'true');
        mobileNav?.setAttribute('aria-modal', 'true');
        document.body.classList.add('no-scroll');
    }

    function closeMenu() {
        mobileNav?.classList.remove('active');
        overlay?.classList.remove('active');
        menuBtn?.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
    }

    menuBtn?.addEventListener('click', openMenu);
    closeBtn?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);

    // --- Countries / Categories dropdown nav ---
    // JS drives open/close state so pointer, touch and keyboard all agree.
    // The CSS :hover fallback is disabled by adding .nav-js (see style.css).
    function closeAllDropdowns(except) {
        document.querySelectorAll('.nav-dropdown.active').forEach(function(d) {
            if (d !== except) d.classList.remove('active');
        });
        document.querySelectorAll('.nav-dropdown-toggle[aria-expanded="true"]').forEach(function(t) {
            const dd = t.parentElement && t.parentElement.querySelector('.nav-dropdown');
            if (dd !== except) t.setAttribute('aria-expanded', 'false');
        });
    }

    document.querySelectorAll('.main-nav').forEach(function(n) { n.classList.add('nav-js'); });
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    document.querySelectorAll('.nav-item-countries, .nav-item-categories').forEach(function(item) {
        const toggle = item.querySelector('.nav-dropdown-toggle');
        const dropdown = item.querySelector('.nav-dropdown');
        if (!toggle || !dropdown) return;
        let closeTimer = null;

        function openDropdown() {
            clearTimeout(closeTimer);
            closeAllDropdowns(dropdown);
            dropdown.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
        }
        function closeDropdown() {
            clearTimeout(closeTimer);
            dropdown.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        }
        // small grace period so a brief slip off the menu doesn't close it
        function scheduleClose() {
            clearTimeout(closeTimer);
            closeTimer = setTimeout(closeDropdown, 180);
        }

        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggle.getAttribute('aria-expanded') === 'true' ? closeDropdown() : openDropdown();
        });

        if (canHover) {
            item.addEventListener('mouseenter', openDropdown);
            item.addEventListener('mouseleave', scheduleClose);
        }

        item.addEventListener('focusin', openDropdown);
        item.addEventListener('focusout', function(e) {
            if (!item.contains(e.relatedTarget)) closeDropdown();
        });

        toggle.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                openDropdown();
                const first = dropdown.querySelector('a');
                if (first) first.focus();
            }
        });

        dropdown.addEventListener('keydown', function(e) {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Escape') return;
            const links = Array.prototype.slice.call(dropdown.querySelectorAll('a'));
            const i = links.indexOf(document.activeElement);
            e.preventDefault();
            if (e.key === 'Escape') { closeDropdown(); toggle.focus(); }
            else if (e.key === 'ArrowDown') (links[i + 1] || links[0]).focus();
            else (links[i - 1] || links[links.length - 1]).focus();
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-item-countries, .nav-item-categories')) closeAllDropdowns();
    });

    // --- Keyboard Shortcuts ---
    const isInputTarget = function(target) {
        return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    };

    function openKeyboardHelp() {
        let modal = document.querySelector('.keyboard-help');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'keyboard-help';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-label', 'Keyboard shortcuts');
            modal.innerHTML = '<div class="keyboard-help-inner">' +
                '<h3>Keyboard Shortcuts</h3>' +
                '<ul>' +
                '<li><kbd>/</kbd> Search</li>' +
                '<li><kbd>Esc</kbd> Close</li>' +
                '<li><kbd>t</kbd> Dark Mode</li>' +
                '<li><kbd>?</kbd> This Help</li>' +
                '</ul>' +
                '<p class="keyboard-help-hint">Press Escape or click outside to close</p>' +
                '</div>';
            document.body.appendChild(modal);
        }
        modal.classList.add('active');
        console.log('Keyboard help opened');
    }

    function closeKeyboardHelp() {
        const modal = document.querySelector('.keyboard-help');
        if (modal) modal.classList.remove('active');
    }

    document.addEventListener('keydown', function(e) {
        // Close open overlays first, regardless of target
        if (e.key === 'Escape') {
            closeMenu();
            closeKeyboardHelp();
            closeAllDropdowns();
            if (searchOverlay.classList.contains('active')) {
                closeSearch();
            }
            return;
        }

        // Skip shortcuts when typing in inputs
        if (isInputTarget(e.target)) return;

        if (e.key === '/') {
            e.preventDefault();
            if (searchOverlay.classList.contains('active')) {
                searchInput.focus();
            } else {
                openSearch();
            }
            console.log('Keyboard shortcut: search');
        } else if (e.key === 't' || e.key === 'T') {
            document.querySelector('.theme-toggle')?.click();
            console.log('Keyboard shortcut: theme toggle');
        } else if (e.key === '?' ) {
            // '?' is Shift + / on most keyboards; e.key already distinguishes it
            e.preventDefault();
            openKeyboardHelp();
        }
    });

    // Close keyboard help on click outside
    document.addEventListener('click', function(e) {
        const modal = document.querySelector('.keyboard-help');
        if (modal && modal.classList.contains('active') && !modal.querySelector('.keyboard-help-inner').contains(e.target)) {
            closeKeyboardHelp();
        }
    });

    // --- FAQ Accordion ---
    document.querySelectorAll('.faq-item').forEach(function(item) {
        const header = item.querySelector('h3');
        if (!header) return;
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');
        function toggleFaq() {
            item.classList.toggle('open');
            header.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
        }
        header.addEventListener('click', toggleFaq);
        header.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleFaq(); }
        });
        // Open first FAQ by default
        if (item === item.parentElement.querySelector('.faq-item')) {
            item.classList.add('open');
            header.setAttribute('aria-expanded', 'true');
        }
    });

    // --- Search Overlay ---
    const searchOverlay = document.createElement('div');
    searchOverlay.className = 'search-overlay';
    searchOverlay.setAttribute('role', 'dialog');
    searchOverlay.setAttribute('aria-label', 'Search');
    searchOverlay.setAttribute('aria-hidden', 'true');

    const searchBackdrop = document.createElement('div');
    searchBackdrop.className = 'search-backdrop';

    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';

    const searchInputWrapper = document.createElement('div');
    searchInputWrapper.className = 'search-input-wrapper';

    const searchInput = document.createElement('input');
    searchInput.className = 'search-input';
    searchInput.type = 'text';
    searchInput.placeholder = document.documentElement.lang === 'ar' ? 'ابحث في المقالات...' : 'Search articles...';
    searchInput.setAttribute('autocomplete', 'off');
    searchInput.setAttribute('aria-label', document.documentElement.lang === 'ar' ? 'البحث في المقالات' : 'Search articles');
    searchInput.setAttribute('aria-controls', 'search-results-list');
    searchInput.setAttribute('aria-autocomplete', 'list');

    const searchClearBtn = document.createElement('button');
    searchClearBtn.className = 'search-clear-btn';
    searchClearBtn.type = 'button';
    searchClearBtn.setAttribute('aria-label', 'Clear search');
    searchClearBtn.innerHTML = '&times;';
    searchClearBtn.style.display = 'none';

    searchInputWrapper.appendChild(searchInput);
    searchInputWrapper.appendChild(searchClearBtn);

    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.id = 'search-results-list';
    searchResults.setAttribute('role', 'listbox');
    searchResults.setAttribute('aria-live', 'polite');

    searchContainer.appendChild(searchInputWrapper);
    searchContainer.appendChild(searchResults);
    searchOverlay.appendChild(searchBackdrop);
    searchOverlay.appendChild(searchContainer);
    document.body.appendChild(searchOverlay);

    const searchFocusableElements = [searchInput, searchClearBtn];

    function setSearchOverlayInteractive(isOpen) {
        searchOverlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        searchOverlay.inert = !isOpen;
        searchFocusableElements.forEach(function(element) {
            if (isOpen) {
                element.removeAttribute('tabindex');
            } else {
                element.setAttribute('tabindex', '-1');
            }
        });
    }

    setSearchOverlayInteractive(false);

    // --- Search Index Loading ---
    var searchIndex = null;
    var searchIndexLoaded = false;
    function getSearchIndexUrl() {
      var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
      return '/assets/js/search-index.' + lang + '.json';
    }
    function loadSearchIndex() {
      if (searchIndexLoaded) return Promise.resolve(searchIndex);
      return fetch(getSearchIndexUrl())
        .then(function(r) { return r.json(); })
        .then(function(data) { searchIndex = data; searchIndexLoaded = true; return data; })
        .catch(function() { searchIndex = { articles: [] }; searchIndexLoaded = true; return searchIndex; });
    }

    // --- Text Normalization ---
    function normalizeText(text, lang) {
      text = text.toLowerCase().trim();
      if (lang === 'ar') {
        text = text.replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
                   .replace(/[أإآا]/g, 'ا')
                   .replace(/ى/g, 'ي')
                   .replace(/ة/g, 'ه');
      }
      return text.replace(/[^\w\s\u0600-\u06FF]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function tokenize(text, lang) {
      return normalizeText(text, lang).split(/\s+/).filter(function(w) { return w.length > 1; });
    }

    // --- Fuzzy Matching + Levenshtein ---
    function levenshtein(a, b) {
      var m = a.length, n = b.length;
      if (m === 0) return n;
      if (n === 0) return m;
      var prev = new Array(n + 1);
      var curr = new Array(n + 1);
      for (var j = 0; j <= n; j++) prev[j] = j;
      for (var i = 1; i <= m; i++) {
        curr[0] = i;
        for (var j = 1; j <= n; j++) {
          var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
          curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
        }
        var tmp = prev; prev = curr; curr = tmp;
      }
      return prev[n];
    }
    function wordScore(queryWord, textWord) {
      if (textWord === queryWord) return 1.0;
      if (textWord.indexOf(queryWord) === 0) return 0.8;
      if (textWord.indexOf(queryWord) !== -1) return 0.6;
      var dist = levenshtein(queryWord, textWord);
      if (dist <= 2 && queryWord.length > 3) return 0.4 - (dist * 0.1);
      return 0;
    }

    // --- Relevance Scoring ---
    function calculateScore(queryWords, article) {
      var score = 0;
      var titleWords = tokenize(article.title, article.language);
      var descWords = tokenize(article.description, article.language);
      var excerptWords = tokenize(article.excerpt, article.language);
      var catWords = tokenize(article.category, article.language);
      var kwWords = article.keywords ? article.keywords.map(function(k) { return normalizeText(k, article.language); }) : [];
      var slugWords = tokenize(article.slug, article.language);

      var allMatchTitle = true, allMatchDesc = true;

      queryWords.forEach(function(qw) {
        var bestTitle = 0, bestDesc = 0, bestExcerpt = 0, bestCat = 0, bestKw = 0, bestSlug = 0;
        titleWords.forEach(function(tw) { bestTitle = Math.max(bestTitle, wordScore(qw, tw)); });
        descWords.forEach(function(dw) { bestDesc = Math.max(bestDesc, wordScore(qw, dw)); });
        excerptWords.forEach(function(ew) { bestExcerpt = Math.max(bestExcerpt, wordScore(qw, ew)); });
        catWords.forEach(function(cw) { bestCat = Math.max(bestCat, wordScore(qw, cw)); });
        kwWords.forEach(function(kw) { bestKw = Math.max(bestKw, wordScore(qw, kw)); });
        slugWords.forEach(function(sw) { bestSlug = Math.max(bestSlug, wordScore(qw, sw)); });

        score += bestTitle * 10 + bestDesc * 5 + bestExcerpt * 3 + bestCat * 2 + bestKw * 4 + bestSlug * 1;
        if (bestTitle < 0.5) allMatchTitle = false;
        if (bestDesc < 0.5) allMatchDesc = false;
      });

      if (allMatchTitle) score *= 1.5;
      if (allMatchDesc) score *= 1.2;
      return score;
    }

    // --- Search Function ---
    function performSearch(query, limit) {
      limit = limit || 10;
      var queryWords = tokenize(query, document.documentElement.lang);
      if (queryWords.length === 0) return [];

      var results = searchIndex.articles.map(function(article) {
        return { article: article, score: calculateScore(queryWords, article) };
      }).filter(function(r) { return r.score > 0; });

      // Prioritize current language
      var currentLang = document.documentElement.lang;
      results.sort(function(a, b) {
        var langBonusA = a.article.language === currentLang ? 100 : 0;
        var langBonusB = b.article.language === currentLang ? 100 : 0;
        return (b.score + langBonusB) - (a.score + langBonusA);
      });

      return results.slice(0, limit);
    }

    // --- Highlighting ---
    function highlightText(text, queryWords) {
      if (!queryWords.length) return text;
      var normalized = normalizeText(text, document.documentElement.lang);
      var matches = [];
      queryWords.forEach(function(qw) {
        var idx = normalized.indexOf(qw);
        while (idx !== -1) {
          matches.push({ start: idx, end: idx + qw.length });
          idx = normalized.indexOf(qw, idx + 1);
        }
      });
      if (!matches.length) return text;
      matches.sort(function(a, b) { return a.start - b.start; });
      var merged = [];
      matches.forEach(function(m) {
        if (!merged.length || m.start > merged[merged.length - 1].end) {
          merged.push(m);
        } else if (m.end > merged[merged.length - 1].end) {
          merged[merged.length - 1].end = m.end;
        }
      });
      var result = '';
      var last = 0;
      merged.forEach(function(m) {
        result += text.substring(last, m.start) + '<mark class="search-highlight">' + text.substring(m.start, m.end) + '</mark>';
        last = m.end;
      });
      result += text.substring(last);
      return result;
    }

    function getExcerptWithContext(article, queryWords, maxLen) {
      maxLen = maxLen || 100;
      var text = article.excerpt || article.description || '';
      var normalized = normalizeText(text, article.language);
      var bestIdx = -1;
      queryWords.forEach(function(qw) {
        var idx = normalized.indexOf(qw);
        if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) bestIdx = idx;
      });
      if (bestIdx === -1) {
        return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
      }
      var start = Math.max(0, bestIdx - Math.floor(maxLen / 2));
      var end = Math.min(text.length, start + maxLen);
      var prefix = start > 0 ? '...' : '';
      var suffix = end < text.length ? '...' : '';
      return prefix + text.substring(start, end) + suffix;
    }

    // --- Recent Searches ---
    var RECENT_KEY = 'dyk-recent-searches';
    function getRecentSearches() {
      try {
        var raw = localStorage.getItem(RECENT_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    }
    function saveRecentSearch(query) {
      if (!query || !query.trim()) return;
      var recent = getRecentSearches();
      var trimmed = query.trim();
      recent = recent.filter(function(q) { return q !== trimmed; });
      recent.unshift(trimmed);
      if (recent.length > 5) recent = recent.slice(0, 5);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch (e) {}
    }
    function clearRecentSearches() {
      try { localStorage.removeItem(RECENT_KEY); } catch (e) {}
    }

    // --- Search State ---
    var selectedIndex = -1;
    var resultItems = [];
    var isLoadingIndex = false;
    var lastTrackedSearchQuery = '';

    function openSearch() {
        searchOverlay.classList.add('active');
        setSearchOverlayInteractive(true);
        document.body.classList.add('no-scroll');
        setTimeout(function() { searchInput.focus(); }, 50);
        console.log('Search overlay opened');
        if (!searchIndexLoaded && !isLoadingIndex) {
          isLoadingIndex = true;
          loadSearchIndex().then(function() {
            isLoadingIndex = false;
            renderSearchState();
          });
        }
        renderSearchState();
    }

    function closeSearch() {
        searchOverlay.classList.remove('active');
        setSearchOverlayInteractive(false);
        document.body.classList.remove('no-scroll');
        searchInput.value = '';
        searchResults.innerHTML = '';
        selectedIndex = -1;
        resultItems = [];
        searchInput.setAttribute('aria-activedescendant', '');
        searchClearBtn.style.display = 'none';
    }

    searchBackdrop.addEventListener('click', closeSearch);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            closeSearch();
        }
        if (e.key === '/' && !searchOverlay.classList.contains('active')) {
            var activeTag = document.activeElement.tagName;
            if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && !document.activeElement.isContentEditable) {
                e.preventDefault();
                openSearch();
            }
        }
    });

    // --- Clear Button ---
    searchClearBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchInput.focus();
        searchClearBtn.style.display = 'none';
        renderSearchState();
    });

    // --- Keyboard Navigation ---
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (resultItems.length > 0) {
                selectedIndex = Math.min(selectedIndex + 1, resultItems.length - 1);
                updateSelection();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (selectedIndex > 0) {
                selectedIndex--;
                updateSelection();
            } else if (selectedIndex === 0) {
                selectedIndex = -1;
                updateSelection();
                searchInput.focus();
            }
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && resultItems[selectedIndex]) {
                e.preventDefault();
                window.location.href = resultItems[selectedIndex].href;
            } else if (searchInput.value.trim()) {
                saveRecentSearch(searchInput.value.trim());
            }
        }
    });

    function updateSelection() {
        resultItems.forEach(function(el, i) {
            el.classList.toggle('selected', i === selectedIndex);
            if (i === selectedIndex) {
                el.scrollIntoView({ block: 'nearest' });
                searchInput.setAttribute('aria-activedescendant', el.id);
            }
        });
        if (selectedIndex < 0) {
            searchInput.setAttribute('aria-activedescendant', '');
        }
    }

    // --- Debounced Input ---
    let searchDebounceTimer;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchDebounceTimer);
        searchClearBtn.style.display = searchInput.value ? 'block' : 'none';
        searchDebounceTimer = setTimeout(function() {
            renderSearchState();
        }, 200);
    });

    // --- Render Search Results ---
    function renderSearchState() {
        var query = searchInput.value.trim();
        searchResults.innerHTML = '';
        selectedIndex = -1;
        resultItems = [];
        searchInput.setAttribute('aria-activedescendant', '');

        if (!query) {
            // Show recent searches
            var recent = getRecentSearches();
            if (recent.length > 0) {
                var recentHeader = document.createElement('div');
                recentHeader.className = 'search-recent-header';
                recentHeader.innerHTML = '<span>' + (document.documentElement.lang === 'ar' ? 'عمليات البحث الأخيرة' : 'Recent Searches') + '</span>' +
                    '<button class="search-clear-recent" type="button">' + (document.documentElement.lang === 'ar' ? 'مسح' : 'Clear') + '</button>';
                searchResults.appendChild(recentHeader);
                recentHeader.querySelector('.search-clear-recent').addEventListener('click', function() {
                    clearRecentSearches();
                    renderSearchState();
                });
                recent.forEach(function(q) {
                    var chip = document.createElement('button');
                    chip.className = 'search-recent-chip';
                    chip.type = 'button';
                    chip.textContent = q;
                    chip.addEventListener('click', function() {
                        searchInput.value = q;
                        searchClearBtn.style.display = 'block';
                        renderSearchState();
                    });
                    searchResults.appendChild(chip);
                });
            }
            return;
        }

        if (!searchIndexLoaded) {
            var loading = document.createElement('div');
            loading.className = 'search-loading';
            loading.innerHTML = '<span class="search-loading-dots">' + (document.documentElement.lang === 'ar' ? 'جارٍ تحميل فهرس البحث' : 'Loading search index') + '</span>';
            searchResults.appendChild(loading);
            return;
        }

        var queryWords = tokenize(query, document.documentElement.lang);
        if (queryWords.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'search-empty-state';
            empty.textContent = document.documentElement.lang === 'ar' ? 'لم يتم العثور على نتائج.' : 'No results found.';
            searchResults.appendChild(empty);
            return;
        }

        var results = performSearch(query, 10);

        if (query !== lastTrackedSearchQuery) {
            lastTrackedSearchQuery = query;
            sendGA4Event('search', {
                search_term: query,
                result_count: results.length,
                language: document.documentElement.lang || 'en'
            });
        }

        if (results.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'search-empty-state';
            var suggestions = document.documentElement.lang === 'ar'
                ? ['دبي', 'السعودية', 'تأشيرة', 'كأس العالم', 'سفر']
                : ['Dubai', 'Saudi', 'visa', 'World Cup', 'travel'];
            empty.innerHTML = '<div>' + (document.documentElement.lang === 'ar' ? 'لم يتم العثور على نتائج لـ' : 'No results found for') + ' \'' + escapeHtml(query) + '\'.</div>' +
                '<div class="search-suggestions">' + suggestions.map(function(s) {
                    return '<button class="search-suggestion" type="button">' + escapeHtml(s) + '</button>';
                }).join('') + '</div>';
            searchResults.appendChild(empty);
            empty.querySelectorAll('.search-suggestion').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    searchInput.value = btn.textContent;
                    searchClearBtn.style.display = 'block';
                    renderSearchState();
                });
            });
            return;
        }

        // Result count
        var countEl = document.createElement('div');
        countEl.className = 'search-count';
        countEl.textContent = results.length + (document.documentElement.lang === 'ar' ? ' نتيجة' : ' results found');
        searchResults.appendChild(countEl);

        results.forEach(function(r, i) {
            var article = r.article;
            var a = document.createElement('a');
            a.className = 'search-result-item';
            a.href = article.url;
            a.id = 'search-result-' + i;
            a.setAttribute('role', 'option');

            var titleRow = document.createElement('div');
            titleRow.className = 'search-result-title-row';

            var title = document.createElement('div');
            title.className = 'search-result-title';
            title.innerHTML = highlightText(article.title, queryWords);
            titleRow.appendChild(title);

            var langBadge = document.createElement('span');
            langBadge.className = 'search-lang-badge';
            langBadge.textContent = article.language === 'ar' ? 'AR' : 'EN';
            titleRow.appendChild(langBadge);

            a.appendChild(titleRow);

            var metaRow = document.createElement('div');
            metaRow.className = 'search-result-meta-row';

            var catBadge = document.createElement('span');
            catBadge.className = 'category-badge badge-' + (article.categorySlug || article.category.toLowerCase());
            catBadge.textContent = article.category;
            metaRow.appendChild(catBadge);

            a.appendChild(metaRow);

            var excerpt = document.createElement('div');
            excerpt.className = 'search-result-excerpt';
            excerpt.innerHTML = highlightText(getExcerptWithContext(article, queryWords, 100), queryWords);
            a.appendChild(excerpt);

            a.addEventListener('click', function() {
                saveRecentSearch(query);
            });

            searchResults.appendChild(a);
            resultItems.push(a);
        });
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    document.querySelectorAll('.search-toggle').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            openSearch();
        });
    });

    // --- Toast Notification System ---
    function showToast(message, type, duration) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'info');
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.addEventListener('click', function() {
            dismissToast(toast);
        });
        toast.appendChild(textSpan);
        toast.appendChild(closeBtn);
        container.appendChild(toast);
        console.log('Toast shown:', { message: message, type: type });
        
        const dismissTimer = setTimeout(function() {
            dismissToast(toast);
        }, duration || 4000);
        
        function dismissToast(t) {
            if (!t.parentNode) return;
            clearTimeout(dismissTimer);
            t.classList.add('toast-exit');
            t.addEventListener('animationend', function handler() {
                t.removeEventListener('animationend', handler);
                t.remove();
                if (container && !container.children.length) {
                    container.remove();
                }
            });
        }
    }

    // --- Copy Link ---
    document.querySelectorAll('.share-btn.copy').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var pageInfo = getPageInfo();
            sendGA4Event('share', {
                method: 'copy',
                content_type: pageInfo.contentType,
                article_id: pageInfo.articleId,
                article_title: pageInfo.articleTitle
            });
            navigator.clipboard.writeText(window.location.href).then(function() {
                showToast('✓ Link copied to clipboard', 'success', 3000);
            }).catch(function() {
                // Fallback
                const input = document.createElement('input');
                input.value = window.location.href;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                showToast('✓ Link copied to clipboard', 'success', 3000);
            });
        });
    });

    // --- WhatsApp Share ---
    document.querySelectorAll('.share-btn.whatsapp').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var pageInfo = getPageInfo();
            sendGA4Event('share', {
                method: 'whatsapp',
                content_type: pageInfo.contentType,
                article_id: pageInfo.articleId,
                article_title: pageInfo.articleTitle
            });
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(document.title);
            window.open('https://wa.me/?text=' + text + ' ' + url, '_blank', 'noopener,noreferrer');
        });
    });

    // --- Twitter Share ---
    document.querySelectorAll('.share-btn.twitter').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var pageInfo = getPageInfo();
            sendGA4Event('share', {
                method: 'twitter',
                content_type: pageInfo.contentType,
                article_id: pageInfo.articleId,
                article_title: pageInfo.articleTitle
            });
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(document.title);
            window.open('https://twitter.com/intent/tweet?text=' + text + '&url=' + url, '_blank', 'noopener,noreferrer');
        });
    });

    // --- Facebook Share ---
    document.querySelectorAll('.share-btn.facebook').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var pageInfo = getPageInfo();
            sendGA4Event('share', {
                method: 'facebook',
                content_type: pageInfo.contentType,
                article_id: pageInfo.articleId,
                article_title: pageInfo.articleTitle
            });
            const url = encodeURIComponent(window.location.href);
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank', 'noopener,noreferrer');
        });
    });

    // --- Email Share ---
    document.querySelectorAll('.share-btn.email').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var pageInfo = getPageInfo();
            sendGA4Event('share', {
                method: 'email',
                content_type: pageInfo.contentType,
                article_id: pageInfo.articleId,
                article_title: pageInfo.articleTitle
            });
            const subject = encodeURIComponent('Check out: ' + document.title);
            const body = encodeURIComponent('I found this interesting article:\n\n' + document.title + '\n' + window.location.href);
            window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
        });
    });

    // --- Lead capture instrumentation ---
    // Conversion events are reserved for a confirmed capture response. Static mailto
    // fallbacks only record intent because opening a mail client is not a submission.
    var leadCaptureInFlight = typeof WeakSet === 'function' ? new WeakSet() : null;
    var leadConversions = typeof WeakMap === 'function' ? new WeakMap() : null;
    function leadParams(form, method, outcome) {
        return {
            form_type: form.classList.contains('contact-form') ? 'contact' : 'newsletter',
            method: method,
            outcome: outcome,
            language: document.documentElement.lang || 'en'
        };
        if (!form.classList.contains('contact-form') && typeof newsletterAttribution === 'object') {
            params.utm_source = newsletterAttribution.utm_source || '(direct)';
            params.utm_medium = newsletterAttribution.utm_medium || '(none)';
            params.utm_campaign = newsletterAttribution.utm_campaign || '(not set)';
        }
    }
    function emitLeadConversion(form, eventName, method) {
        var events = leadConversions ? (leadConversions.get(form) || new Set()) : null;
        if (events && events.has(eventName)) return;
        if (events) {
            events.add(eventName);
            leadConversions.set(form, events);
        }
        sendGA4Event(eventName, leadParams(form, method, 'success'));
    }
    function captureLead(form, payload, onSuccess, onFailure) {
        var endpoint = form.getAttribute('data-capture-endpoint') || form.getAttribute('action');
        if (!endpoint || endpoint === '#' || /^mailto:/i.test(endpoint)) return false;
        if (leadCaptureInFlight && leadCaptureInFlight.has(form)) return true;
        if (leadCaptureInFlight) leadCaptureInFlight.add(form);
        fetch(endpoint, {
            method: (form.getAttribute('method') || 'POST').toUpperCase(),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'omit'
        }).then(function(response) {
            if (!response.ok) throw new Error('capture failed');
            onSuccess();
        }).catch(function() {
            if (leadCaptureInFlight) leadCaptureInFlight.delete(form);
            onFailure();
        });
        return true;
    }
    function mailtoIntent(form, method) {
        sendGA4Event(form.classList.contains('contact-form') ? 'contact_form_intent' : 'newsletter_signup_intent',
            leadParams(form, method, 'intent'));
    }

    document.querySelectorAll('form.contact-form').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (leadCaptureInFlight && leadCaptureInFlight.has(form)) return;
            var isAr = (document.documentElement.lang || 'en') === 'ar';
            var fields = form.querySelectorAll('input, select, textarea');
            var lines = [], payload = {};
            var subject = isAr ? 'رسالة عبر doyouknow.app' : 'Message via doyouknow.app';
            fields.forEach(function(field) {
                var value = field.value.trim();
                var name = field.name || field.type;
                if (/^(subject|الموضوع)$/i.test(name) && value) subject = value;
                lines.push(name + ': ' + value);
                if (name) payload[name] = value;
            });
            var method = form.getAttribute('data-capture-endpoint') ? 'api' : 'mailto';
            var success = function() {
                emitLeadConversion(form, 'contact_form_submit', method);
                showToast(isAr ? 'تم إرسال رسالتك بنجاح' : 'Your message was sent successfully', 'success', 6000);
            };
            var fallback = function() {
                window.location.href = 'mailto:hello@doyouknow.app?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\\n'));
                mailtoIntent(form, 'mailto');
            };
            if (!captureLead(form, payload, success, fallback)) fallback();
        });
    });

    // --- Newsletter Forms ---
    // Keep campaign attribution across the mailto handoff without storing the email address.
    var NEWSLETTER_ATTRIBUTION_KEY = 'dyk-newsletter-attribution';
    var NEWSLETTER_ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    function getNewsletterAttribution() {
        var attribution = {};
        try {
            var query = new URLSearchParams(window.location.search);
            NEWSLETTER_ATTRIBUTION_KEYS.forEach(function(key) {
                var value = query.get(key) || sessionStorage.getItem(key);
                if (value) {
                    attribution[key] = value;
                    sessionStorage.setItem(key, value);
                }
            });
            if (Object.keys(attribution).length) {
                localStorage.setItem(NEWSLETTER_ATTRIBUTION_KEY, JSON.stringify(attribution));
            } else {
                attribution = JSON.parse(localStorage.getItem(NEWSLETTER_ATTRIBUTION_KEY) || '{}');
            }
        } catch (e) {}
        return attribution;
    }
    var newsletterAttribution = getNewsletterAttribution();

    document.querySelectorAll('.newsletter-form, .newsletter-signup, .footer-newsletter').forEach(function(form) {
        var input = form.querySelector('input[type="email"]');
        if (!input) return;
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (leadCaptureInFlight && leadCaptureInFlight.has(form)) return;
            var email = input.value.trim(), lang = document.documentElement.lang || 'en';
            if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
                input.style.borderColor = 'var(--color-error)';
                input.setAttribute('aria-invalid', 'true');
                sendGA4Event('newsletter_error', { error_type: 'invalid_email', language: lang });
                return;
            }
            input.style.borderColor = 'var(--color-secondary-accent)';
            input.setAttribute('aria-invalid', 'false');
            var method = form.getAttribute('data-capture-endpoint') ? 'api' : 'mailto';
            var source = form.classList.contains('footer-newsletter') ? 'footer_cta' : 'inline_cta';
            var payload = { email: email, language: lang, source: source };
            var success = function() {
                emitLeadConversion(form, 'newsletter_signup', method);
                emitLeadConversion(form, 'generate_lead', method);
                showToast(lang === 'ar' ? 'تم تأكيد اشتراكك بنجاح' : 'You are subscribed successfully', 'success', 6000);
            };
            var fallback = function() {
                var nlSubject = lang === 'ar' ? 'اشتراك في نشرة doyouknow.app' : 'Subscribe to the doyouknow.app newsletter';
                var nlBody = lang === 'ar'
                    ? 'أرغب في الاشتراك في النشرة البريدية.\nبريدي الإلكتروني: ' + email
                    : 'Please subscribe me to the newsletter.\nMy email: ' + email;
                var attribution = newsletterAttribution;
                var attributionQuery = Object.keys(attribution).map(function(key) {
                    return key + '=' + encodeURIComponent(attribution[key]);
                }).join('&');
                if (attributionQuery) nlBody += '\n\nCampaign: ' + attributionQuery;
                try {
                    localStorage.setItem('dyk-newsletter-pending', JSON.stringify({
                        timestamp: new Date().toISOString(),
                        outcome: 'intent',
                        method: 'mailto',
                        language: lang,
                        attribution: attribution
                    }));
                } catch (e) {}
                window.location.href = 'mailto:hello@doyouknow.app?subject=' + encodeURIComponent(nlSubject) + '&body=' + encodeURIComponent(nlBody);
                mailtoIntent(form, 'mailto');
                sendGA4Event('generate_lead_intent', leadParams(form, 'mailto', 'intent'));
            };
            if (!captureLead(form, payload, success, fallback)) fallback();
        });
    });

    // --- Lazy Loading Images ---
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        }, { rootMargin: '50px 0px' });

        document.querySelectorAll('img[data-src]').forEach(function(img) {
            imageObserver.observe(img);
        });
    }

    // --- Scroll Reveal Animation ---
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.reveal').forEach(function(el) {
            revealObserver.observe(el);
        });
    } else {
        // Fallback: show all immediately
        document.querySelectorAll('.reveal').forEach(function(el) {
            el.classList.add('visible');
        });
    }

    // --- Sticky Header Shadow ---
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                const header = document.querySelector('.site-header');
                if (header) {
                    if (window.scrollY > 10) {
                        header.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                    } else {
                        header.style.boxShadow = 'none';
                    }
                }
                ticking = false;
            });
            ticking = true;
        }
    });

    // --- TOC Active Link ---
    const toc = document.querySelector('.toc');
    if (toc && 'IntersectionObserver' in window) {
        const tocLinks = toc.querySelectorAll('a');
        const headings = document.querySelectorAll('.article-body h2, .article-body h3');
        const headingObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    tocLinks.forEach(function(link) {
                        link.style.borderLeftColor = 'transparent';
                        link.style.paddingLeft = 'var(--space-3)';
                        link.style.color = 'var(--color-text-secondary)';
                    });
                    const activeLink = toc.querySelector('a[href="#' + entry.target.id + '"]');
                    if (activeLink) {
                        activeLink.style.borderLeftColor = 'var(--color-primary-accent)';
                        activeLink.style.paddingLeft = 'var(--space-4)';
                        activeLink.style.color = 'var(--color-primary-accent)';
                    }
                }
            });
        }, { rootMargin: '-80px 0px -60% 0px' });

        headings.forEach(function(h) {
            headingObserver.observe(h);
        });
    }

    // --- Language Switcher ---
    document.querySelectorAll('.lang-switch').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const currentPath = window.location.pathname;
            const targetLang = currentPath.startsWith('/ar/') ? 'en' : 'ar';
            const alternate = document.querySelector('link[rel="alternate"][hreflang="' + targetLang + '"]');
            if (alternate && alternate.href) {
                window.location.href = alternate.href;
                return;
            }
            window.location.href = '/' + targetLang + '/';
        });
    });

    // --- Smooth Scroll for Anchor Links ---
    function scrollToTarget(target) {
        if (!target) return;
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;
        const target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        scrollToTarget(target);
        history.pushState(null, '', hash);
        console.log('Smooth scroll to:', hash);
    });

    window.addEventListener('hashchange', function() {
        const target = document.querySelector(window.location.hash);
        if (target) {
            scrollToTarget(target);
            console.log('Hash change scroll to:', window.location.hash);
        }
    });

    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) {
            setTimeout(function() {
                scrollToTarget(target);
            }, 0);
        }
    }

    // --- Scroll Progress (optional) ---
    const progressBar = document.querySelector('.scroll-progress');
    if (progressBar) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = progress + '%';
        });
    }

    // --- Back to Top Button ---
    (function() {
        if (!document.querySelector('.article-body')) return;

        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Back to top');
        btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
        document.body.appendChild(btn);

        let btnTicking = false;
        function updateBackToTop() {
            if (window.scrollY > 500) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
            btnTicking = false;
        }

        window.addEventListener('scroll', function() {
            if (!btnTicking) {
                window.requestAnimationFrame(updateBackToTop);
                btnTicking = true;
            }
        }, { passive: true });

        btn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            console.log('Back to top clicked');
        });
    })();

    // --- Article Read Progress (Scroll Depth) ---
    let scrollDepths = {};
    function trackArticleReadProgress() {
        var pageInfo = getPageInfo();
        if (!pageInfo.isArticle) return;
        const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
        [25, 50, 75, 90].forEach(function(threshold) {
            if (scrollPercent >= threshold && !scrollDepths[threshold]) {
                scrollDepths[threshold] = true;
                sendGA4Event('article_read_progress', {
                    article_id: pageInfo.articleId,
                    article_title: pageInfo.articleTitle,
                    percent_scrolled: threshold
                });
            }
        });
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                trackArticleReadProgress();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // --- Click Event Delegation (GA4) ---
    document.addEventListener('click', function(e) {
        var pageInfo = getPageInfo();

        // Category badge clicks
        var categoryBadge = e.target.closest('.category-badge a, .category-badge');
        if (categoryBadge) {
            sendGA4Event('click', {
                click_type: 'category_badge',
                category: categoryBadge.textContent.trim(),
                language: pageInfo.language
            });
            return;
        }

        // Related article clicks
        var relatedCard = e.target.closest('.related-card');
        if (relatedCard) {
            var href = relatedCard.getAttribute('href') || '';
            var match = href.match(/\/article\/([^/]+)(?:\.html)?$/);
            var clickedArticleId = match ? match[1] : href;
            sendGA4Event('click', {
                click_type: 'related_article',
                article_id: clickedArticleId,
                source_article_id: pageInfo.articleId,
                language: pageInfo.language
            });
            return;
        }

        // Language switcher clicks
        var langSwitch = e.target.closest('.lang-switch');
        if (langSwitch) {
            var currentLang = document.documentElement.lang || 'en';
            var toLang = currentLang === 'ar' ? 'en' : 'ar';
            sendGA4Event('click', {
                click_type: 'language_switcher',
                from_lang: currentLang,
                to_lang: toLang
            });
            return;
        }

        // Work With Us link clicks
        var workWithUs = e.target.closest('a[href*="work-with-us"]');
        if (workWithUs) {
            sendGA4Event('click', {
                click_type: 'work_with_us',
                language: pageInfo.language
            });
            return;
        }

        // Outbound clicks
        var outboundLink = e.target.closest('a[href^="http"]');
        if (outboundLink) {
            var href = outboundLink.getAttribute('href') || '';
            if (href.indexOf('doyouknow.app') === -1) {
                try {
                    var url = new URL(href);
                    sendGA4Event('outbound_click', {
                        link_url: href,
                        link_domain: url.hostname,
                        link_text: outboundLink.textContent.trim()
                    });
                } catch (err) {
                    sendGA4Event('outbound_click', {
                        link_url: href,
                        link_domain: '',
                        link_text: outboundLink.textContent.trim()
                    });
                }
            }
        }
    });

    // --- Video / Audio Play Tracking ---
    document.querySelectorAll('video, audio').forEach(function(media) {
        media.addEventListener('play', function() {
            var isVideo = media.tagName.toLowerCase() === 'video';
            sendGA4Event(isVideo ? 'video_play' : 'audio_play', {
                media_src: media.currentSrc || media.src || '',
                media_title: media.getAttribute('title') || document.title
            });
        });
    });

    // --- Service Worker (PWA) ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(function() {
            // Silently fail - SW is optional
        });
    }

    // --- Page View with Custom Parameters ---
    var pageInfo = getPageInfo();
    sendGA4Event('page_view', {
        article_id: pageInfo.articleId,
        article_category: pageInfo.articleCategory,
        language: pageInfo.language,
        content_type: pageInfo.contentType
    });

    console.log('doyouknow.app loaded ✨');
})();
