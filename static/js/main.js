document.addEventListener('DOMContentLoaded', () => {
    // Восстанавливаем видимость страницы после скрытия при переходе к якорям
    if (window.location.hash && !window.location.hash.startsWith('#year-')) {
        requestAnimationFrame(() => {
            document.documentElement.style.visibility = '';
        });
    }

    // Подсветка блоков кода через highlight.js
    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
    }

    // Авто-определение пропорций обложки статьи (широкоформатная vs квадратная)
    document.querySelectorAll('.qz-hero-image img').forEach((img) => {
        const checkRatio = () => {
            if (img.naturalWidth && img.naturalHeight) {
                const ratio = img.naturalWidth / img.naturalHeight;
                if (ratio >= 1.25) {
                    img.closest('.qz-hero-image').classList.add('qz-hero-wide');
                }
            }
        };

        if (img.complete) {
            checkRatio();
        } else {
            img.addEventListener('load', checkRatio);
        }
    });

    // Полноэкранный просмотр изображений (Lightbox)
    const lightbox = document.getElementById('qz-lightbox');
    const lightboxImg = document.getElementById('qz-lightbox-img');

    const openLightbox = (src, alt) => {
        if (!src || !lightbox || !lightboxImg) return;
        lightboxImg.src = src;
        lightboxImg.alt = alt || '';
        lightbox.classList.remove('hidden');
        requestAnimationFrame(() => {
            lightbox.classList.remove('opacity-0');
            lightboxImg.classList.remove('scale-95');
            lightboxImg.classList.add('scale-100');
        });
    };

    const closeLightbox = () => {
        if (!lightbox || !lightboxImg) return;
        lightbox.classList.add('opacity-0');
        lightboxImg.classList.remove('scale-100');
        lightboxImg.classList.add('scale-95');
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightboxImg.src = '';
        }, 200);
    };

    if (lightbox) {
        lightbox.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
        lightbox.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }

    document.addEventListener('click', (e) => {
        const img = e.target.closest('.wiki-article img, .qz-hero-image img, .post-cover-img, .qz-dialog-avatar-img');
        if (img) {
            openLightbox(img.src, img.alt);
        } else if (lightbox && !lightbox.classList.contains('hidden')) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox && !lightbox.classList.contains('hidden')) {
            closeLightbox();
        }
    });

    // Кнопка копирования содержимого блоков кода
    document.querySelectorAll('.wiki-article pre').forEach((pre) => {
        const code = pre.querySelector('code');
        if (!code) return;
        let lang = 'text';
        code.classList.forEach((cls) => {
            if (cls.startsWith('language-')) {
                lang = cls.replace('language-', '');
            }
        });
        const wrapper = document.createElement('div');
        wrapper.className = 'qz-code-block';
        const header = document.createElement('div');
        header.className = 'qz-code-header';
        header.innerHTML = `
            <span class="qz-code-lang">${lang}</span>
            <button type="button" class="qz-code-copy" title="Copy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span class="qz-copy-label">Copy</span>
            </button>
        `;
        const copyBtn = header.querySelector('.qz-code-copy');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(code.innerText).then(() => {
                copyBtn.classList.add('qz-code-copied');
                const label = copyBtn.querySelector('.qz-copy-label');
                label.innerText = 'Copied!';
                setTimeout(() => {
                    copyBtn.classList.remove('qz-code-copied');
                    label.innerText = 'Copy';
                }, 1500);
            });
        });
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
    });

    // Инициализация KaTeX
    function initKaTeX() {
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ],
                throwOnError: false
            });
        } else {
            setTimeout(initKaTeX, 50);
        }
    }
    initKaTeX();

    // Логика бесконечной карусели карточек (Steam-style)
    document.querySelectorAll('.qz-carousel').forEach(carousel => {
        const track = carousel.querySelector('.qz-carousel-track');
        if (!track) return;
        const cards = Array.from(track.children);
        const btnPrev = carousel.querySelector('.qz-carousel-btn.prev');
        const btnNext = carousel.querySelector('.qz-carousel-btn.next');

        if (cards.length < 2) {
            if (btnPrev) btnPrev.style.display = 'none';
            if (btnNext) btnNext.style.display = 'none';
            return;
        }

        let intervalId;
        const delay = parseInt(carousel.getAttribute('data-interval') || '4500', 10);
        let isTransitioning = false;

        const moveNext = () => {
            if (isTransitioning) return;
            isTransitioning = true;

            const gap = parseInt(window.getComputedStyle(track).gap) || 0;
            const shift = track.children[0].offsetWidth + gap;

            track.style.transition = 'transform 0.4s ease-in-out';
            track.style.transform = `translateX(-${shift}px)`;

            setTimeout(() => {
                track.style.transition = 'none';
                track.appendChild(track.children[0]);
                track.style.transform = 'translateX(0)';
                isTransitioning = false;
            }, 400);
        };

        const movePrev = () => {
            if (isTransitioning) return;
            isTransitioning = true;

            const gap = parseInt(window.getComputedStyle(track).gap) || 0;
            const shift = track.children[0].offsetWidth + gap;

            track.style.transition = 'none';
            track.insertBefore(track.lastElementChild, track.children[0]);
            track.style.transform = `translateX(-${shift}px)`;

            void track.offsetWidth;

            track.style.transition = 'transform 0.4s ease-in-out';
            track.style.transform = 'translateX(0)';

            setTimeout(() => {
                isTransitioning = false;
            }, 400);
        };

        const startAutoPlay = () => {
            intervalId = setInterval(moveNext, delay);
        };

        const stopAutoPlay = () => {
            clearInterval(intervalId);
        };

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                stopAutoPlay();
                moveNext();
                startAutoPlay();
            });
        }

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                stopAutoPlay();
                movePrev();
                startAutoPlay();
            });
        }

        carousel.addEventListener('mouseenter', stopAutoPlay);
        carousel.addEventListener('mouseleave', startAutoPlay);

        startAutoPlay();
    });

    // Детектор переполнения для fade-out длинных постов в ленте
    document.querySelectorAll('.qz-feed-clamp').forEach((el) => {
        if (el.scrollHeight > el.clientHeight + 8) {
            el.classList.add('has-overflow');
        }
    });

    // === База данных лайков: Оптимистичный UI с кэшем чисел в localStorage ===
    const LIKES_API_URL = 'https://script.google.com/macros/s/AKfycbwVnLnaCYgsKggrYUeTsysWY0aIsBh0zPGCoJekGKIXk6OjDmu8gC83hFLvUxTVmfxv/exec';
    const MAX_LIKES_LIMIT = 99999;
    const STORAGE_COUNTS_KEY = 'qz_likes_counts_cache';
    const reactionButtons = Array.from(document.querySelectorAll('.qz-reaction-btn'));

    if (reactionButtons.length > 0) {
        let cachedCounts = {};
        try {
            cachedCounts = JSON.parse(localStorage.getItem(STORAGE_COUNTS_KEY) || '{}');
        } catch (_) {}

        const saveCountsCache = () => {
            try {
                localStorage.setItem(STORAGE_COUNTS_KEY, JSON.stringify(cachedCounts));
            } catch (_) {}
        };

        const slugsToFetch = [];

        reactionButtons.forEach((btn) => {
            const slug = btn.getAttribute('data-post-id');
            if (!slug) return;

            slugsToFetch.push(slug);
            const safeKey = slug.replace(/[^a-zA-Z0-9_-]/g, '_');
            const storageLikedKey = `qz_liked_${safeKey}`;
            const heartIcon = btn.querySelector('.qz-heart-icon');
            const countLabel = btn.querySelector('.qz-reaction-count');

            let isLiked = localStorage.getItem(storageLikedKey) === 'true';

            // МГНОВЕННО (0 мс) подставляем число из кэша памяти, не дожидаясь ответа сервера
            if (countLabel && typeof cachedCounts[slug] === 'number') {
                countLabel.innerText = Math.min(MAX_LIKES_LIMIT, Math.max(0, cachedCounts[slug]));
            }

            const updateUI = () => {
                if (isLiked) {
                    btn.classList.add('liked');
                    if (heartIcon) heartIcon.textContent = '❤️';
                } else {
                    btn.classList.remove('liked');
                    if (heartIcon) heartIcon.textContent = '🤍';
                }
            };

            updateUI();

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                let currentCount = parseInt(countLabel ? countLabel.innerText : '0', 10);
                if (isNaN(currentCount)) currentCount = 0;

                const action = isLiked ? 'like_down' : 'like_up';
                isLiked = !isLiked;

                if (isLiked) {
                    currentCount = Math.min(MAX_LIKES_LIMIT, currentCount + 1);
                } else {
                    currentCount = Math.max(0, currentCount - 1);
                }

                cachedCounts[slug] = currentCount;
                saveCountsCache();
                localStorage.setItem(storageLikedKey, isLiked ? 'true' : 'false');
                if (countLabel) countLabel.innerText = currentCount;
                updateUI();

                fetch(`${LIKES_API_URL}?slug=${encodeURIComponent(slug)}&action=${action}`, { redirect: 'follow' })
                    .then((r) => r.json())
                    .then((data) => {
                        if (countLabel && typeof data.likes === 'number') {
                            const verifiedLikes = Math.min(MAX_LIKES_LIMIT, Math.max(0, data.likes));
                            cachedCounts[slug] = verifiedLikes;
                            saveCountsCache();
                            countLabel.innerText = verifiedLikes;
                        }
                    })
                    .catch((err) => console.log('Likes sync error:', err));
            };
        });

        // Фоновый пакетный запрос: обновляет кэш, если кто-то другой поставил лайк
        if (slugsToFetch.length > 0) {
            fetch(`${LIKES_API_URL}?action=get&slugs=${encodeURIComponent(slugsToFetch.join('|'))}`, { redirect: 'follow' })
                .then((r) => r.json())
                .then((batchData) => {
                    reactionButtons.forEach((btn) => {
                        const slug = btn.getAttribute('data-post-id');
                        if (slug && typeof batchData[slug] === 'number') {
                            const verified = Math.min(MAX_LIKES_LIMIT, Math.max(0, batchData[slug]));
                            cachedCounts[slug] = verified;
                            const countLabel = btn.querySelector('.qz-reaction-count');
                            if (countLabel) countLabel.innerText = verified;
                        }
                    });
                    saveCountsCache();
                })
                .catch((err) => console.log('Batch fetch error:', err));
        }
    }
});