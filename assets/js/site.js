/* ============================================
   doyouknow.app — Site Scripts
   Dark mode, mobile menu, share, FAQ, lazy load
   ============================================ */

(function() {
    'use strict';

    // --- Dark Mode ---
    const STORAGE_KEY = 'dyk-theme';
    const PREFERS_DARK = window.matchMedia('(prefers-color-scheme: dark)');
    const html = document.documentElement;

    function getTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;
        return PREFERS_DARK.matches ? 'dark' : 'light';
    }

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        const btn = document.querySelector('.theme-toggle');
        if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }

    setTheme(getTheme());

    document.querySelector('.theme-toggle')?.addEventListener('click', function() {
        const current = html.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });

    PREFERS_DARK.addEventListener('change', function(e) {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

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
            return;
        }

        // Skip shortcuts when typing in inputs
        if (isInputTarget(e.target)) return;

        if (e.key === '/') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input, input[type="search"]');
            if (searchInput) {
                searchInput.focus();
            } else {
                document.querySelector('.search-toggle')?.click();
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

    const searchInput = document.createElement('input');
    searchInput.className = 'search-input';
    searchInput.type = 'text';
    searchInput.placeholder = document.documentElement.lang === 'ar' ? 'ابحث في المقالات...' : 'Search articles...';
    searchInput.setAttribute('autocomplete', 'off');
    searchInput.setAttribute('aria-label', document.documentElement.lang === 'ar' ? 'البحث في المقالات' : 'Search articles');

    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.setAttribute('aria-live', 'polite');

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchResults);
    searchOverlay.appendChild(searchBackdrop);
    searchOverlay.appendChild(searchContainer);
    document.body.appendChild(searchOverlay);

    let articleIndex = [];
    function buildArticleIndex() {
        articleIndex = [];
        document.querySelectorAll('.article-card').forEach(function(card) {
            const titleEl = card.querySelector('.card-title');
            const badgeEl = card.querySelector('.category-badge');
            if (titleEl && card.href) {
                articleIndex.push({
                    title: titleEl.textContent.trim(),
                    category: badgeEl ? badgeEl.textContent.trim() : '',
                    url: card.href
                });
            }
        });
        if (articleIndex.length === 0) {
            articleIndex = [
                { title: 'Best Beaches in Dubai: 12 Top Picks for Every Type of Traveler', category: 'General', url: '/en/article/best-beaches-dubai.html' },
                { title: 'Best Restaurants in Dubai: 15 Top Picks for Every Taste and Budget', category: 'General', url: '/en/article/best-restaurants-dubai.html' },
                { title: 'Burj Khalifa: 10 Surprising Facts You Didn\'t Know', category: 'General', url: '/en/article/burj-khalifa-facts.html' }
            ];
        }
    }
    buildArticleIndex();

    function openSearch() {
        searchOverlay.classList.add('active');
        searchOverlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        setTimeout(function() { searchInput.focus(); }, 50);
        console.log('Search overlay opened');
    }

    function closeSearch() {
        searchOverlay.classList.remove('active');
        searchOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
        searchInput.value = '';
        searchResults.innerHTML = '';
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

    let searchDebounceTimer;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(function() {
            performSearch(searchInput.value.trim());
        }, 200);
    });

    function performSearch(query) {
        searchResults.innerHTML = '';
        if (!query) return;

        var lower = query.toLowerCase();
        var matches = articleIndex.filter(function(item) {
            return item.title.toLowerCase().includes(lower) || item.category.toLowerCase().includes(lower);
        });

        if (matches.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'search-empty-state';
            empty.textContent = 'No results found. Try \'Dubai\' or \'Saudi\'.';
            searchResults.appendChild(empty);
            return;
        }

        matches.forEach(function(item) {
            var a = document.createElement('a');
            a.className = 'search-result-item';
            a.href = item.url;
            var title = document.createElement('div');
            title.className = 'search-result-title';
            title.textContent = item.title;
            var meta = document.createElement('div');
            meta.className = 'search-result-meta';
            meta.textContent = item.category;
            a.appendChild(title);
            a.appendChild(meta);
            searchResults.appendChild(a);
        });
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
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(document.title);
            window.open('https://wa.me/?text=' + text + ' ' + url, '_blank', 'noopener,noreferrer');
        });
    });

    // --- Twitter Share ---
    document.querySelectorAll('.share-btn.twitter').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(document.title);
            window.open('https://twitter.com/intent/tweet?text=' + text + '&url=' + url, '_blank', 'noopener,noreferrer');
        });
    });

    // --- Facebook Share ---
    document.querySelectorAll('.share-btn.facebook').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = encodeURIComponent(window.location.href);
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank', 'noopener,noreferrer');
        });
    });

    // --- Email Share ---
    document.querySelectorAll('.share-btn.email').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const subject = encodeURIComponent('Check out: ' + document.title);
            const body = encodeURIComponent('I found this interesting article:\n\n' + document.title + '\n' + window.location.href);
            window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
        });
    });

    // --- Newsletter Forms ---
    document.querySelectorAll('.newsletter-form, .newsletter-signup, .footer-newsletter').forEach(function(form) {
        const btn = form.querySelector('button, .btn');
        const input = form.querySelector('input[type="email"]');
        if (!btn || !input) return;
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const email = input.value.trim();
            if (!email || !email.includes('@')) {
                input.style.borderColor = 'var(--color-error)';
                input.setAttribute('aria-invalid', 'true');
                showToast('Please enter a valid email address', 'error', 4000);
                return;
            }
            input.style.borderColor = 'var(--color-secondary-accent)';
            input.setAttribute('aria-invalid', 'false');
            input.value = '';
            showToast('✓ Subscribed!', 'success', 3000);
            // In production, send to Mailchimp/ConvertKit/ConvertKit API
            console.log('Newsletter signup:', email);
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
            // Articles are independently commissioned, not machine translations.
            // Until paired translations exist, switch to the other language hub.
            const newPath = currentPath.startsWith('/ar/') ? '/en/' : '/ar/';
            window.location.href = newPath;
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

    // --- Analytics Events (GA4-like) ---
    // Track share clicks
    document.querySelectorAll('.share-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const platform = btn.classList.contains('whatsapp') ? 'whatsapp' :
                btn.classList.contains('twitter') ? 'twitter' :
                btn.classList.contains('facebook') ? 'facebook' :
                btn.classList.contains('email') ? 'email' :
                btn.classList.contains('copy') ? 'copy' : 'unknown';
            // In production, send to GA4:
            // gtag('event', 'share', { method: platform, content_type: 'article', content_id: articleId });
            console.log('Share event:', platform);
        });
    });

    // Track newsletter signup
    document.querySelectorAll('.newsletter-form button').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (!btn.disabled) {
                console.log('Newsletter event: signup_attempt');
            }
        });
    });

    // Track scroll depth
    let scrollDepths = {};
    function trackScrollDepth() {
        const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
        [25, 50, 75, 90].forEach(function(threshold) {
            if (scrollPercent >= threshold && !scrollDepths[threshold]) {
                scrollDepths[threshold] = true;
                console.log('Scroll depth:', threshold + '%');
                // gtag('event', 'scroll', { percent_scrolled: threshold });
            }
        });
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                trackScrollDepth();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // --- Service Worker (PWA) ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(function() {
            // Silently fail - SW is optional
        });
    }

    console.log('doyouknow.app loaded ✨');
})();
