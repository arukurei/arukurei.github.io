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

    // Реакции на посты (Сердечко + localStorage)
    document.querySelectorAll('.qz-reaction-btn').forEach(btn => {
        const postId = btn.getAttribute('data-post-id');
        if (!postId) return;

        const storageLikedKey = `qz_liked_${postId}`;
        const heartIcon = btn.querySelector('.qz-heart-icon');
        const countLabel = btn.querySelector('.qz-reaction-count');

        // Проверяем сохраненный кэш лайков из GitHub
        const cachedData = JSON.parse(localStorage.getItem(`qz_cache_reaction_${postId}`) || '{}');
        let isLiked = cachedData.liked !== undefined ? cachedData.liked : (localStorage.getItem(storageLikedKey) === 'true');
        let initialCount = cachedData.count !== undefined ? cachedData.count : (countLabel ? countLabel.innerText : '0');

        const updateUI = () => {
            if (isLiked) {
                btn.classList.add('liked');
                if (heartIcon) heartIcon.innerText = '❤️';
            } else {
                btn.classList.remove('liked');
                if (heartIcon) heartIcon.innerText = '🤍';
            }
            if (countLabel) countLabel.innerText = initialCount;
        };

        updateUI();

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // При клике на сердечко просто плавно скроллим к блоку реакций
            const commentsSection = document.getElementById('comments-section') || document.getElementById('comments');
            if (commentsSection) {
                commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Синхронизация сердечек из GitHub Discussions (Giscus)
    window.addEventListener('message', (event) => {
        if (event.origin !== 'https://giscus.app') return;
        if (!(typeof event.data === 'object' && event.data.giscus)) return;

        const giscusData = event.data.giscus;
        if (giscusData.discussion) {
            // Записываем живое число комментариев в скобки заголовка
            const countEl = document.getElementById('giscus-comments-count');
            if (countEl && giscusData.discussion.totalCommentCount !== undefined) {
                countEl.innerText = `(${giscusData.discussion.totalCommentCount})`;
            }
        }

        if (giscusData.discussion && giscusData.discussion.reactions) {
            const heartReaction = giscusData.discussion.reactions.HEART;
            if (heartReaction) {
                const totalHearts = heartReaction.count || 0;
                const viewerHasReacted = heartReaction.viewerHasReacted || false;

                // Получаем ID текущего поста из URL (например, post_name)
                const currentPostPath = window.location.pathname.replace(/\/$/, '').split('/').pop();

                document.querySelectorAll('.qz-reaction-btn').forEach(btn => {
                    const heartIcon = btn.querySelector('.qz-heart-icon');
                    const countLabel = btn.querySelector('.qz-reaction-count');

                    if (viewerHasReacted) {
                        btn.classList.add('liked');
                        if (heartIcon) heartIcon.innerText = '❤️';
                    } else {
                        btn.classList.remove('liked');
                        if (heartIcon) heartIcon.innerText = '🤍';
                    }
                    if (countLabel) countLabel.innerText = totalHearts;

                    // Сохраняем в память браузера, чтобы в общей ленте пост ТОЖЕ был красным с этой цифрой!
                    if (currentPostPath) {
                        localStorage.setItem(`qz_cache_reaction_${currentPostPath}`, JSON.stringify({
                            count: totalHearts,
                            liked: viewerHasReacted
                        }));
                    }
                });
            }
        }
    });
});