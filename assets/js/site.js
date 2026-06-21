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

    // Close on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeMenu();
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

    // Search is currently a curated content index rather than a misleading empty control.
    document.querySelectorAll('.search-toggle').forEach(function(button) {
        button.addEventListener('click', function() {
            window.location.href = window.location.pathname.startsWith('/ar/')
                ? '/ar/category/General.html'
                : '/en/category/General.html';
        });
    });

    // --- Copy Link ---
    document.querySelectorAll('.share-btn.copy').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            navigator.clipboard.writeText(window.location.href).then(function() {
                const original = btn.innerHTML;
                btn.innerHTML = '✓ Copied';
                btn.classList.add('copied');
                setTimeout(function() {
                    btn.innerHTML = original;
                    btn.classList.remove('copied');
                }, 2000);
            }).catch(function() {
                // Fallback
                const input = document.createElement('input');
                input.value = window.location.href;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                const original = btn.innerHTML;
                btn.innerHTML = '✓ Copied';
                btn.classList.add('copied');
                setTimeout(function() {
                    btn.innerHTML = original;
                    btn.classList.remove('copied');
                }, 2000);
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
                return;
            }
            input.style.borderColor = 'var(--color-secondary-accent)';
            input.setAttribute('aria-invalid', 'false');
            const original = btn.innerHTML || btn.textContent;
            btn.innerHTML = '✓ Subscribed!';
            btn.disabled = true;
            setTimeout(function() {
                btn.innerHTML = original;
                btn.disabled = false;
                input.value = '';
            }, 3000);
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
