/**
 * Легковесный PJAX-роутер оболочки сайта (SPA-навигация).
 * - Предотвращает перезагрузку страницы, шапки и логотипа.
 * - Предзагружает страницы при наведении курсора (Prefetch).
 * - Бесшовно меняет контент (<main>), меню (#site-nav) и футер (#site-footer-container).
 * - Обновляет фоны только при их реальном изменении.
 */
(() => {
    const pageInitCallbacks = [];

    // Глобальная функция регистрации слушателей смены страниц
    window.onPageLoad = (fn) => {
        if (typeof fn === 'function') {
            pageInitCallbacks.push(fn);
            if (document.readyState !== 'loading') {
                try { fn(); } catch (e) { console.error(e); }
            }
        }
    };

    const runCallbacks = () => {
        pageInitCallbacks.forEach((fn) => {
            try { fn(); } catch (err) { console.error('onPageLoad error:', err); }
        });
    };

    const cache = new Map();

    const fetchPage = async (url) => {
        const cleanUrl = url.split('#')[0];
        if (!cache.has(cleanUrl)) {
            const promise = fetch(cleanUrl, { headers: { 'X-Requested-With': 'Router' } })
                .then(async (res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return await res.text();
                })
                .catch((err) => {
                    cache.delete(cleanUrl);
                    throw err;
                });
            cache.set(cleanUrl, promise);
        }
        return cache.get(cleanUrl);
    };

    const isValidLink = (a, e) => {
        if (!a || e.defaultPrevented || e.button !== 0) return false;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
        if (a.target === '_blank' || a.hasAttribute('download')) return false;

        const href = a.getAttribute('href');
        if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;

        try {
            const linkUrl = new URL(a.href, window.location.href);
            if (linkUrl.origin !== window.location.origin) return false;
            // Игнорируем медиа и статику
            if (linkUrl.pathname.startsWith('/media/') || linkUrl.pathname.startsWith('/static/')) return false;
            // Игнорируем клик по якорю на этой же странице
            if (linkUrl.pathname === window.location.pathname && linkUrl.search === window.location.search && linkUrl.hash) {
                return false;
            }
            return true;
        } catch (_) {
            return false;
        }
    };

    const navigateTo = async (url, push = true) => {
        try {
            const htmlText = await fetchPage(url);
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            const performSwap = () => {
                // 1. Заголовок и язык документа
                document.title = doc.title;
                if (doc.documentElement.lang) {
                    document.documentElement.lang = doc.documentElement.lang;
                }

                // 2. Фон страницы (меняем только если он отличается, чтобы не моргать)
                const currentBgEl = document.getElementById('site-page-bg');
                const newBgEl = doc.getElementById('site-page-bg');
                if (currentBgEl && newBgEl && currentBgEl.textContent !== newBgEl.textContent) {
                    currentBgEl.textContent = newBgEl.textContent;
                }

                // 3. Подмена блоков
                const swapIds = ['site-nav', 'site-main', 'site-footer-container'];
                swapIds.forEach((id) => {
                    const oldEl = document.getElementById(id);
                    const newEl = doc.getElementById(id);
                    if (oldEl && newEl) {
                        oldEl.replaceWith(newEl);
                    }
                });

                // 4. Выполнение inline-скриптов новой страницы (например, календаря в поиске)
                const newMain = document.getElementById('site-main');
                if (newMain) {
                    const scripts = newMain.querySelectorAll('script');
                    scripts.forEach((oldScript) => {
                        const newScript = document.createElement('script');
                        Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
                        newScript.textContent = oldScript.textContent;
                        oldScript.replaceWith(newScript);
                    });
                }

                // 5. История и скролл
                if (push) {
                    window.history.pushState(null, '', url);
                }

                const hash = window.location.hash;
                if (hash) {
                    const targetEl = document.getElementById(decodeURIComponent(hash.slice(1)));
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'auto' });
                    } else {
                        window.scrollTo(0, 0);
                    }
                } else {
                    window.scrollTo(0, 0);
                }

                // 6. Запуск логики для нового контента
                runCallbacks();
            };

            // Поддержка View Transitions API (плавный переход в современных браузерах)
            if (document.startViewTransition) {
                document.startViewTransition(() => performSwap());
            } else {
                performSwap();
            }

        } catch (err) {
            console.warn('Router fallback to full reload:', err);
            window.location.href = url;
        }
    };

    // Перехват кликов
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (isValidLink(a, e)) {
            e.preventDefault();
            navigateTo(a.href, true);
        }
    });

    // Предзагрузка при наведении (prefetch)
    document.addEventListener('mouseover', (e) => {
        const a = e.target.closest('a');
        if (a && a.origin === window.location.origin) {
            const href = a.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('/static/') && !href.startsWith('/media/')) {
                fetchPage(a.href).catch(() => {});
            }
        }
    }, { passive: true });

    // История Назад/Вперед
    window.addEventListener('popstate', () => {
        navigateTo(window.location.href, false);
    });

    // Первый запуск
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runCallbacks);
    } else {
        runCallbacks();
    }
})();