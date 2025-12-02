/* ============================================
   MODERN INTERACTIONS - Kathrin Coaching Website
   Smooth animations, scroll effects, and interactivity
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {

    // -----------------------------------------
    // SCROLL PROGRESS INDICATOR
    // -----------------------------------------
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.width = '0%';
    document.body.prepend(progressBar);

    window.addEventListener('scroll', function() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        progressBar.style.width = progress + '%';
    });

    // -----------------------------------------
    // HEADER SCROLL EFFECT
    // -----------------------------------------
    const header = document.querySelector('.site-header, header');
    let lastScroll = 0;

    if (header) {
        window.addEventListener('scroll', function() {
            const currentScroll = window.scrollY;

            if (currentScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Hide/show header on scroll
            if (currentScroll > lastScroll && currentScroll > 200) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }

            lastScroll = currentScroll;
        });
    }

    // -----------------------------------------
    // MOBILE MENU TOGGLE
    // -----------------------------------------
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-toggle';
    mobileMenuBtn.innerHTML = '<span></span><span></span><span></span>';
    mobileMenuBtn.setAttribute('aria-label', 'Menu');
    mobileMenuBtn.style.cssText = `
        display: none;
        flex-direction: column;
        justify-content: space-between;
        width: 28px;
        height: 20px;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        z-index: 1001;
    `;

    // Style the hamburger lines
    const style = document.createElement('style');
    style.textContent = `
        .mobile-menu-toggle span {
            display: block;
            width: 100%;
            height: 2px;
            background: #2c3e50;
            transition: all 0.3s ease;
            transform-origin: center;
        }
        .mobile-menu-toggle.active span:nth-child(1) {
            transform: translateY(9px) rotate(45deg);
        }
        .mobile-menu-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        .mobile-menu-toggle.active span:nth-child(3) {
            transform: translateY(-9px) rotate(-45deg);
        }
        @media (max-width: 991px) {
            .mobile-menu-toggle {
                display: flex !important;
            }
        }
        .mobile-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 998;
        }
        .mobile-overlay.active {
            opacity: 1;
            visibility: visible;
        }
    `;
    document.head.appendChild(style);

    const navContainer = document.querySelector('.site-branding, .header-wrap');
    if (navContainer) {
        navContainer.appendChild(mobileMenuBtn);
    }

    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);

    mobileMenuBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        navMenu?.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = this.classList.contains('active') ? 'hidden' : '';
    });

    overlay.addEventListener('click', function() {
        mobileMenuBtn.classList.remove('active');
        navMenu?.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Mobile submenu toggle
    const menuItemsWithChildren = document.querySelectorAll('.menu-item-has-children');
    menuItemsWithChildren.forEach(item => {
        const link = item.querySelector(':scope > a');
        if (link && window.innerWidth <= 991) {
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 991) {
                    e.preventDefault();
                    item.classList.toggle('active');
                }
            });
        }
    });

    // -----------------------------------------
    // SCROLL ANIMATIONS (Intersection Observer)
    // -----------------------------------------
    const animateOnScroll = function() {
        const elements = document.querySelectorAll(
            '.elementor-widget, .elementor-column, .target-group-card, article, .elementor-post'
        );

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
            observer.observe(el);
        });
    };

    // Run after a short delay to let page render
    setTimeout(animateOnScroll, 100);

    // -----------------------------------------
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // -----------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerOffset = 100;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // -----------------------------------------
    // FLOATING CTA BUTTON
    // -----------------------------------------
    const floatingCTA = document.createElement('a');
    floatingCTA.className = 'floating-cta';
    floatingCTA.href = 'contact.html';
    floatingCTA.innerHTML = 'Gespräch buchen';
    floatingCTA.onclick = function(e) {
        if (typeof bookErstgespraech === 'function') {
            e.preventDefault();
            bookErstgespraech();
        }
    };

    // Only show after scrolling down
    floatingCTA.style.opacity = '0';
    floatingCTA.style.visibility = 'hidden';
    document.body.appendChild(floatingCTA);

    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            floatingCTA.style.opacity = '1';
            floatingCTA.style.visibility = 'visible';
        } else {
            floatingCTA.style.opacity = '0';
            floatingCTA.style.visibility = 'hidden';
        }
    });

    // -----------------------------------------
    // FAQ / ACCORDION FUNCTIONALITY
    // -----------------------------------------
    const accordionItems = document.querySelectorAll('.elementor-accordion-item, .faq-item');

    accordionItems.forEach(item => {
        const title = item.querySelector('.elementor-tab-title, .faq-question');
        const content = item.querySelector('.elementor-tab-content, .faq-answer');

        if (title && content) {
            // Initially hide content
            content.style.maxHeight = '0';
            content.style.overflow = 'hidden';
            content.style.transition = 'max-height 0.3s ease';

            title.addEventListener('click', function() {
                const isActive = item.classList.contains('active');

                // Close all other items
                accordionItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherContent = otherItem.querySelector('.elementor-tab-content, .faq-answer');
                        if (otherContent) {
                            otherContent.style.maxHeight = '0';
                        }
                    }
                });

                // Toggle current item
                if (isActive) {
                    item.classList.remove('active');
                    content.style.maxHeight = '0';
                } else {
                    item.classList.add('active');
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        }
    });

    // -----------------------------------------
    // IMAGE LAZY LOADING ENHANCEMENT
    // -----------------------------------------
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 0.5s ease';

                    img.onload = function() {
                        img.style.opacity = '1';
                    };

                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // -----------------------------------------
    // PARALLAX EFFECT FOR HERO SECTIONS
    // -----------------------------------------
    const parallaxSections = document.querySelectorAll('.elementor-section-height-full, .elementor-section-height-min-height');

    if (parallaxSections.length > 0 && window.innerWidth > 768) {
        window.addEventListener('scroll', function() {
            const scrolled = window.scrollY;

            parallaxSections.forEach(section => {
                const speed = 0.3;
                const yPos = -(scrolled * speed);
                section.style.backgroundPositionY = yPos + 'px';
            });
        });
    }

    // -----------------------------------------
    // COUNTER ANIMATION (for statistics)
    // -----------------------------------------
    const counters = document.querySelectorAll('.elementor-counter-number');

    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-to-value') || counter.textContent);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.round(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    };

    if (counters.length > 0) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => counterObserver.observe(counter));
    }

    // -----------------------------------------
    // TOOLTIP INITIALIZATION
    // -----------------------------------------
    const tooltipElements = document.querySelectorAll('[data-tooltip]');

    tooltipElements.forEach(el => {
        const tooltipText = el.getAttribute('data-tooltip');
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        tooltip.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #2c3e50;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 0.85rem;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s ease;
            pointer-events: none;
        `;

        el.style.position = 'relative';
        el.appendChild(tooltip);

        el.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
        });

        el.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
        });
    });

    // -----------------------------------------
    // EXPANDABLE CONTENT ("Mehr lesen" / "Weniger")
    // -----------------------------------------
    const expandableContents = document.querySelectorAll('.expandable-content');

    expandableContents.forEach(container => {
        const toggle = container.querySelector('.expand-toggle');
        if (toggle) {
            toggle.addEventListener('click', function() {
                container.classList.toggle('expanded');
                const isExpanded = container.classList.contains('expanded');
                toggle.textContent = isExpanded ? 'Weniger anzeigen' : 'Mehr lesen';
            });
        }
    });

    // -----------------------------------------
    // COMPACT CARDS (Click to expand)
    // -----------------------------------------
    const compactCards = document.querySelectorAll('.compact-card');

    compactCards.forEach(card => {
        const header = card.querySelector('.card-header');
        if (header) {
            header.addEventListener('click', function() {
                // Close other cards (optional - for accordion behavior)
                // compactCards.forEach(c => { if (c !== card) c.classList.remove('expanded'); });

                card.classList.toggle('expanded');
            });
        }
    });

    // -----------------------------------------
    // AUTO-TRUNCATE LONG TEXT (make expandable)
    // -----------------------------------------
    const longTextBlocks = document.querySelectorAll('.elementor-widget-text-editor, .entry-content');

    longTextBlocks.forEach(block => {
        const text = block.textContent || '';
        const wordCount = text.split(/\s+/).length;

        // If text is longer than 200 words, make it expandable
        if (wordCount > 200 && !block.closest('.expandable-content')) {
            const originalHTML = block.innerHTML;

            // Wrap content
            block.innerHTML = `
                <div class="content-preview">${originalHTML}</div>
                <button class="expand-toggle" type="button">Mehr lesen</button>
            `;
            block.classList.add('expandable-content');

            const toggle = block.querySelector('.expand-toggle');
            toggle.addEventListener('click', function() {
                block.classList.toggle('expanded');
                const isExpanded = block.classList.contains('expanded');
                toggle.textContent = isExpanded ? 'Weniger anzeigen' : 'Mehr lesen';
            });
        }
    });

    // -----------------------------------------
    // READING TIME INDICATOR
    // -----------------------------------------
    const articleContent = document.querySelector('.entry-content, .elementor-widget-text-editor');
    if (articleContent) {
        const text = articleContent.textContent || '';
        const wordCount = text.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

        if (readingTime > 1) {
            const readingIndicator = document.createElement('div');
            readingIndicator.className = 'reading-time';
            readingIndicator.innerHTML = `<span>📖 ${readingTime} Min. Lesezeit</span>`;
            readingIndicator.style.cssText = `
                font-size: 0.85rem;
                color: #6b6b6b;
                margin-bottom: 1rem;
                padding: 8px 0;
                border-bottom: 1px solid #f0ebe5;
            `;

            // Insert before content
            const heading = document.querySelector('.entry-title, h1');
            if (heading && heading.nextElementSibling) {
                heading.parentNode.insertBefore(readingIndicator, heading.nextElementSibling);
            }
        }
    }

    // -----------------------------------------
    // CONSOLE LOG
    // -----------------------------------------
    console.log('Modern Interactions loaded successfully.');

});
