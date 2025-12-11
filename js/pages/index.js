/**
 * Index Page JavaScript
 * CSP-safe implementation with event delegation
 * No inline onclick handlers required
 */
(function() {
    'use strict';

    // ==========================================
    // BOOKING FUNCTIONS
    // ==========================================

    window.bookCall = function() {
        if (typeof Cal !== 'undefined') {
            Cal("openModal", {
                calLink: "kathrin-stahl/erstgespraech",
                config: { layout: "month_view", theme: "light" }
            });
        } else {
            window.open('https://cal.com/kathrin-stahl/erstgespraech', '_blank');
        }
    };

    window.bookRetreat = function() {
        if (typeof Cal !== 'undefined') {
            Cal("openModal", {
                calLink: "kathrin-stahl/retreat-beratung",
                config: { layout: "month_view", theme: "light" }
            });
        } else {
            window.open('https://cal.com/kathrin-stahl/retreat-beratung', '_blank');
        }
    };

    // ==========================================
    // SERVICE MODAL FUNCTIONS
    // ==========================================

    window.openServiceModal = function(serviceType) {
        const modal = document.getElementById('modal-' + serviceType);
        const overlay = document.getElementById('serviceModalOverlay');
        if (modal && overlay) {
            overlay.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeServiceModal = function() {
        document.querySelectorAll('.service-modal').forEach(modal => {
            modal.classList.remove('active');
        });
        const overlay = document.getElementById('serviceModalOverlay');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    window.toggleService = function(toggleElement) {
        const card = toggleElement.closest('.service-card');
        if (card) {
            const serviceType = card.dataset.service;
            openServiceModal(serviceType);
        }
    };

    // ==========================================
    // QUIZ FUNCTIONALITY
    // ==========================================

    let quizAnswers = [];
    let currentStep = 1;

    window.selectQuizOption = function(option) {
        const step = option.closest('.quiz-step');
        if (!step) return;

        const stepNum = parseInt(step.dataset.step);

        // Mark option as selected
        step.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        // Store answer
        quizAnswers[stepNum - 1] = option.dataset.value;

        // Wait a moment, then proceed
        setTimeout(() => {
            if (stepNum < 3) {
                step.style.display = 'none';
                const nextStep = document.querySelector(`.quiz-step[data-step="${stepNum + 1}"]`);
                if (nextStep) nextStep.style.display = 'block';

                // Update progress dots
                document.querySelectorAll('.quiz-progress-dot').forEach(dot => {
                    const dotStep = parseInt(dot.dataset.step);
                    dot.classList.remove('active', 'completed');
                    if (dotStep < stepNum + 1) dot.classList.add('completed');
                    if (dotStep === stepNum + 1) dot.classList.add('active');
                });

                currentStep = stepNum + 1;
            } else {
                showQuizResult();
            }
        }, 300);
    };

    function showQuizResult() {
        document.querySelectorAll('.quiz-step').forEach(step => step.style.display = 'none');
        const progress = document.querySelector('.quiz-progress');
        if (progress) progress.style.display = 'none';

        // Determine result
        const counts = { einzel: 0, paar: 0, retreat: 0 };
        quizAnswers.forEach(answer => {
            if (answer === 'paar' || answer === 'gemeinsam') counts.paar++;
            else if (answer === 'retreat' || answer === 'tief' || answer === 'vorort') counts.retreat++;
            else counts.einzel++;
        });

        let result = 'einzel';
        if (counts.paar >= counts.einzel && counts.paar >= counts.retreat) result = 'paar';
        else if (counts.retreat >= counts.einzel && counts.retreat >= counts.paar) result = 'retreat';

        const resultElement = document.querySelector(`.quiz-result[data-result="${result}"]`);
        if (resultElement) resultElement.classList.add('active');

        document.querySelectorAll('.quiz-progress-dot').forEach(dot => {
            dot.classList.remove('active');
            dot.classList.add('completed');
        });
    }

    window.resetQuiz = function() {
        quizAnswers = [];
        currentStep = 1;

        document.querySelectorAll('.quiz-result').forEach(r => r.classList.remove('active'));
        document.querySelectorAll('.quiz-step').forEach((step, i) => {
            step.style.display = i === 0 ? 'block' : 'none';
            step.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
        });

        const progress = document.querySelector('.quiz-progress');
        if (progress) progress.style.display = 'flex';

        document.querySelectorAll('.quiz-progress-dot').forEach((dot, i) => {
            dot.classList.remove('active', 'completed');
            if (i === 0) dot.classList.add('active');
        });
    };

    // ==========================================
    // VIDEO MODAL
    // ==========================================

    window.openVideoModal = function(videoId) {
        const modal = document.getElementById('videoModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeVideoModal = function(event) {
        if (!event || event.target.classList.contains('video-modal') ||
            event.target.classList.contains('video-modal-close')) {
            const modal = document.getElementById('videoModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    };

    // ==========================================
    // FAQ TOGGLE
    // ==========================================

    window.toggleFaq = function(element) {
        const faqItem = element.closest('.faq-item');
        if (!faqItem) return;

        const isActive = faqItem.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('active'));
        if (!isActive) faqItem.classList.add('active');
    };

    // ==========================================
    // METHOD CARD TOGGLE
    // ==========================================

    window.toggleMethodDetail = function(card) {
        const isExpanded = card.classList.contains('expanded');
        document.querySelectorAll('.method-card').forEach(c => c.classList.remove('expanded'));
        if (!isExpanded) card.classList.add('expanded');
    };

    // ==========================================
    // TRANSFORMATION SLIDER
    // ==========================================

    window.updateTransformation = function(value) {
        const section = document.querySelector('.transformation-section');
        const beforeGradient = document.querySelector('.before-gradient');
        const afterGradient = document.querySelector('.after-gradient');
        const sun = document.querySelector('.sun-element');
        const thumb = document.getElementById('sliderThumb');
        const beforeSide = document.querySelector('.before-side');
        const afterSide = document.querySelector('.after-side');
        const milestones = document.querySelectorAll('.milestone');

        if (!section || !thumb) return;

        thumb.style.left = value + '%';
        const progress = value / 100;

        if (beforeGradient) beforeGradient.style.opacity = 1 - progress;
        if (afterGradient) afterGradient.style.opacity = progress;

        if (sun) {
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const sunBottom = -60 + (easedProgress * 320);
            sun.style.bottom = sunBottom + 'px';
            sun.style.opacity = Math.min(progress * 1.5, 1);
            sun.style.transform = `translateX(-50%) scale(${0.6 + easedProgress * 0.4})`;
        }

        if (progress > 0.5) {
            section.classList.add('bright');
        } else {
            section.classList.remove('bright');
        }

        if (beforeSide) beforeSide.style.opacity = 1 - (progress * 0.6);
        if (afterSide) afterSide.style.opacity = 0.3 + (progress * 0.7);

        const milestoneRanges = {
            0: { start: 0, end: 14 },
            20: { start: 15, end: 34 },
            40: { start: 35, end: 54 },
            60: { start: 55, end: 72 },
            80: { start: 73, end: 88 },
            100: { start: 89, end: 100 }
        };

        milestones.forEach(milestone => {
            const position = parseInt(milestone.dataset.position);
            const range = milestoneRanges[position];
            milestone.classList.remove('active', 'passed');
            if (range && value >= range.start && value <= range.end) {
                milestone.classList.add('active');
            } else if (range && value > range.end) {
                milestone.classList.add('passed');
            }
        });
    };

    // ==========================================
    // READING LIST
    // ==========================================

    let readingList = [];
    try {
        readingList = JSON.parse(localStorage.getItem('readingList') || '[]');
    } catch (e) {
        readingList = [];
    }

    window.updateReadingListUI = function() {
        const count = readingList.length;
        const countEl = document.getElementById('readingListCount');
        const fabEl = document.getElementById('readingListFab');

        if (countEl) countEl.textContent = count;
        if (fabEl) fabEl.classList.toggle('visible', count > 0);

        document.querySelectorAll('.reading-list-btn').forEach(btn => {
            const card = btn.closest('.blog-card');
            if (card) {
                const link = card.querySelector('.blog-card-link');
                const url = link ? link.getAttribute('href') : '';
                btn.classList.toggle('active', readingList.some(item => item.url === url));
            }
        });
    };

    window.toggleReadingList = function(btn, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const card = btn.closest('.blog-card');
        if (!card) return;

        const link = card.querySelector('.blog-card-link');
        const url = link ? link.getAttribute('href') : '';
        const title = card.querySelector('h3')?.textContent || '';
        const img = card.querySelector('.blog-card-image img')?.getAttribute('src') || '';
        const category = card.querySelector('.blog-card-category')?.textContent || '';

        const existingIndex = readingList.findIndex(item => item.url === url);
        if (existingIndex > -1) {
            readingList.splice(existingIndex, 1);
        } else {
            readingList.push({ url, title, img, category });
        }

        localStorage.setItem('readingList', JSON.stringify(readingList));
        updateReadingListUI();
    };

    window.openReadingList = function() {
        const modal = document.getElementById('readingListModal');
        if (modal) {
            modal.classList.add('active');
            renderReadingListItems();
        }
    };

    window.closeReadingList = function() {
        const modal = document.getElementById('readingListModal');
        if (modal) modal.classList.remove('active');
    };

    function renderReadingListItems() {
        const container = document.getElementById('readingListItems');
        if (!container) return;

        if (readingList.length === 0) {
            container.innerHTML = '<p class="empty-list">Noch keine Artikel gespeichert.</p>';
            return;
        }

        container.innerHTML = readingList.map((item, index) => `
            <div class="reading-list-item">
                <a href="${item.url}"><img decoding="async" loading="lazy" src="${item.img}" alt="${item.title}"></a>
                <div class="reading-list-item-content">
                    <a href="${item.url}" style="text-decoration:none;"><h4>${item.title}</h4></a>
                    <span>${item.category}</span>
                </div>
                <button class="reading-list-item-remove" data-index="${index}">&times;</button>
            </div>
        `).join('');
    }

    window.removeFromReadingList = function(index) {
        readingList.splice(index, 1);
        localStorage.setItem('readingList', JSON.stringify(readingList));
        updateReadingListUI();
        renderReadingListItems();
    };

    // ==========================================
    // FLOATING CTA
    // ==========================================

    function initFloatingCTA() {
        const floatingCTA = document.querySelector('.floating-cta');
        const footer = document.querySelector('footer');

        if (!floatingCTA || !footer) return;

        window.addEventListener('scroll', () => {
            const footerTop = footer.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (window.scrollY > 600 && footerTop > windowHeight) {
                floatingCTA.classList.add('visible');
            } else {
                floatingCTA.classList.remove('visible');
            }
        });
    }

    // ==========================================
    // BOOKINGS COUNT
    // ==========================================

    function initBookingsCount() {
        const bookingsEl = document.getElementById('bookings-count');
        if (bookingsEl) {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 1);
            const week = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
            const count = 3 + (week % 3);
            bookingsEl.textContent = count;
        }
    }

    // ==========================================
    // BLOG CATEGORY FILTER
    // ==========================================

    function initCategoryFilter() {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const category = this.dataset.category;
                document.querySelectorAll('.blog-card').forEach(card => {
                    if (category === 'all' || card.dataset.category?.includes(category)) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
    }

    // ==========================================
    // EVENT DELEGATION (CSP-SAFE)
    // ==========================================

    document.addEventListener('click', function(e) {
        const target = e.target;

        // Book call buttons
        if (target.closest('[data-action="bookCall"]') ||
            target.closest('.floating-cta .btn') ||
            target.closest('a[href="#"][onclick*="bookCall"]')) {
            e.preventDefault();
            bookCall();
            return;
        }

        // Book retreat buttons
        if (target.closest('[data-action="bookRetreat"]')) {
            e.preventDefault();
            bookRetreat();
            return;
        }

        // Service toggle
        if (target.closest('.service-toggle')) {
            toggleService(target.closest('.service-toggle'));
            return;
        }

        // Service modal close
        if (target.closest('.service-modal-close')) {
            closeServiceModal();
            return;
        }

        // Service modal overlay
        if (target.id === 'serviceModalOverlay') {
            closeServiceModal();
            return;
        }

        // Service modal action buttons (book and close)
        if (target.closest('.service-modal-actions .btn')) {
            e.preventDefault();
            const btn = target.closest('.btn');
            if (btn.textContent.includes('Retreat')) {
                bookRetreat();
            } else {
                bookCall();
            }
            closeServiceModal();
            return;
        }

        // Quiz options
        if (target.closest('.quiz-option')) {
            selectQuizOption(target.closest('.quiz-option'));
            return;
        }

        // Video intro click
        if (target.closest('.video-intro')) {
            openVideoModal('intro');
            return;
        }

        // Video modal close
        if (target.classList.contains('video-modal') ||
            target.classList.contains('video-modal-close')) {
            closeVideoModal(e);
            return;
        }

        // FAQ toggle
        if (target.closest('.faq-question')) {
            toggleFaq(target.closest('.faq-question'));
            return;
        }

        // Method card toggle
        if (target.closest('.method-card')) {
            toggleMethodDetail(target.closest('.method-card'));
            return;
        }

        // Reading list button
        if (target.closest('.reading-list-btn')) {
            toggleReadingList(target.closest('.reading-list-btn'), e);
            return;
        }

        // Reading list FAB
        if (target.closest('#readingListFab')) {
            openReadingList();
            return;
        }

        // Reading list modal close
        if (target.closest('.reading-list-close') ||
            target.classList.contains('reading-list-modal')) {
            closeReadingList();
            return;
        }

        // Reading list item remove
        if (target.closest('.reading-list-item-remove')) {
            const index = parseInt(target.closest('.reading-list-item-remove').dataset.index);
            removeFromReadingList(index);
            return;
        }
    });

    // Keyboard events
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeServiceModal();
            closeReadingList();
            closeVideoModal({ target: { classList: { contains: () => true } } });
        }
    });

    // Transformation slider input
    document.addEventListener('input', function(e) {
        if (e.target.id === 'transformationSlider' ||
            e.target.closest('.transformation-slider')) {
            updateTransformation(parseInt(e.target.value));
        }
    });

    // ==========================================
    // INITIALIZATION
    // ==========================================

    document.addEventListener('DOMContentLoaded', function() {
        initFloatingCTA();
        initBookingsCount();
        initCategoryFilter();
        updateReadingListUI();
    });

})();
