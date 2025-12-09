/* ============================================
   BLOG ENHANCEMENTS - Kathrin Coaching
   Back-to-Top, Table of Contents, Reading Time
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {

    // -----------------------------------------
    // BACK TO TOP BUTTON
    // -----------------------------------------
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5-5 5 5z"/>
        </svg>
    `;
    backToTop.setAttribute('aria-label', 'Nach oben scrollen');
    document.body.appendChild(backToTop);

    // Show/hide based on scroll position
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    // Smooth scroll to top
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // -----------------------------------------
    // TABLE OF CONTENTS GENERATOR
    // -----------------------------------------
    const articleContent = document.querySelector('.article-content');

    if (articleContent) {
        const headings = articleContent.querySelectorAll('h2, h3');

        // Only generate TOC if there are 3+ headings (indicating longer article)
        if (headings.length >= 3) {
            generateTableOfContents(headings);
        }
    }

    function generateTableOfContents(headings) {
        const toc = document.createElement('div');
        toc.className = 'table-of-contents';

        const tocTitle = document.createElement('h3');
        tocTitle.textContent = 'Inhalt';
        toc.appendChild(tocTitle);

        const tocList = document.createElement('ul');

        headings.forEach((heading, index) => {
            // Add ID to heading for anchor links
            if (!heading.id) {
                const headingId = `heading-${index}`;
                heading.id = headingId;
            }

            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${heading.id}`;
            link.textContent = heading.textContent;

            // Indent h3 items
            if (heading.tagName === 'H3') {
                const nestedList = document.createElement('ul');
                const nestedItem = document.createElement('li');
                nestedItem.appendChild(link);
                nestedList.appendChild(nestedItem);
                listItem.appendChild(nestedList);
            } else {
                listItem.appendChild(link);
            }

            tocList.appendChild(listItem);
        });

        toc.appendChild(tocList);

        // Insert TOC after first paragraph
        const firstParagraph = articleContent.querySelector('p');
        if (firstParagraph) {
            firstParagraph.after(toc);
        }
    }

    // -----------------------------------------
    // READING TIME CALCULATOR
    // -----------------------------------------
    function calculateReadingTime() {
        const content = articleContent?.textContent || '';
        const wordCount = content.trim().split(/\s+/).length;
        const wordsPerMinute = 200;
        const readingTime = Math.ceil(wordCount / wordsPerMinute);

        return readingTime;
    }

    // Add reading time to article meta
    const articleMeta = document.querySelector('.article-meta');
    if (articleMeta && articleContent) {
        const readingTime = calculateReadingTime();
        const readingTimeEl = document.createElement('span');
        readingTimeEl.className = 'reading-time';
        readingTimeEl.textContent = `${readingTime} Min. Lesezeit`;
        articleMeta.appendChild(readingTimeEl);
    }

    // -----------------------------------------
    // SMOOTH SCROLL FOR TOC LINKS
    // -----------------------------------------
    document.querySelectorAll('.table-of-contents a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
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
    // HIGHLIGHT CURRENT TOC SECTION
    // -----------------------------------------
    function highlightCurrentSection() {
        const headings = articleContent?.querySelectorAll('h2, h3');
        if (!headings || headings.length === 0) return;

        const tocLinks = document.querySelectorAll('.table-of-contents a');
        let currentHeading = null;

        headings.forEach(heading => {
            const rect = heading.getBoundingClientRect();
            if (rect.top <= 150) {
                currentHeading = heading;
            }
        });

        // Remove active class from all links
        tocLinks.forEach(link => link.classList.remove('active'));

        // Add active class to current section
        if (currentHeading) {
            const activeLink = document.querySelector(`.table-of-contents a[href="#${currentHeading.id}"]`);
            activeLink?.classList.add('active');
        }
    }

    // Update on scroll
    if (document.querySelector('.table-of-contents')) {
        window.addEventListener('scroll', highlightCurrentSection);
        highlightCurrentSection(); // Initial check
    }

    // Add CSS for active TOC link
    const tocStyle = document.createElement('style');
    tocStyle.textContent = `
        .table-of-contents a.active {
            background: white;
            color: var(--color-primary, #2C4A47);
            font-weight: 600;
        }
    `;
    document.head.appendChild(tocStyle);

    // -----------------------------------------
    // AUTO-ADD SEPARATORS BETWEEN SECTIONS
    // -----------------------------------------
    function addSeparatorsBetweenSections() {
        const h2Headings = articleContent?.querySelectorAll('h2');

        h2Headings?.forEach((heading, index) => {
            // Don't add separator before first heading
            if (index === 0) return;

            // Check if separator already exists
            const prevElement = heading.previousElementSibling;
            if (prevElement?.classList.contains('separator-dots')) return;

            const separator = document.createElement('div');
            separator.className = 'separator-dots';
            heading.before(separator);
        });
    }

    if (articleContent && articleContent.querySelectorAll('h2').length > 2) {
        addSeparatorsBetweenSections();
    }

    // -----------------------------------------
    // ENHANCE EXTERNAL LINKS
    // -----------------------------------------
    const externalLinks = articleContent?.querySelectorAll('a[href^="http"]');
    externalLinks?.forEach(link => {
        // Add external link indicator
        if (!link.hostname.includes('kathrinstahl') &&
            !link.hostname.includes('nickheymann.github.io')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');

            // Add icon after link text
            if (!link.querySelector('.external-icon')) {
                const icon = document.createElement('span');
                icon.className = 'external-icon';
                icon.innerHTML = ' ↗';
                icon.style.fontSize = '0.8em';
                icon.style.opacity = '0.6';
                link.appendChild(icon);
            }
        }
    });

    // -----------------------------------------
    // COPY CODE BLOCKS (if any)
    // -----------------------------------------
    const codeBlocks = articleContent?.querySelectorAll('pre code');
    codeBlocks?.forEach(block => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Kopieren';
        copyBtn.style.cssText = `
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            padding: 0.25rem 0.75rem;
            background: var(--color-accent, #C4A962);
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 0.8rem;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
        `;

        copyBtn.addEventListener('click', function() {
            navigator.clipboard.writeText(block.textContent);
            copyBtn.textContent = 'Kopiert!';
            setTimeout(() => {
                copyBtn.textContent = 'Kopieren';
            }, 2000);
        });

        copyBtn.addEventListener('mouseenter', () => {
            copyBtn.style.opacity = '1';
        });

        copyBtn.addEventListener('mouseleave', () => {
            copyBtn.style.opacity = '0.7';
        });

        block.parentNode.before(wrapper);
        wrapper.appendChild(block.parentNode);
        wrapper.appendChild(copyBtn);
    });

    // -----------------------------------------
    // IMAGE LIGHTBOX (Simple version)
    // -----------------------------------------
    const contentImages = articleContent?.querySelectorAll('img:not(.no-lightbox)');

    contentImages?.forEach(img => {
        // Skip small images (likely icons)
        if (img.naturalWidth < 400) return;

        img.style.cursor = 'zoom-in';

        img.addEventListener('click', function() {
            openLightbox(this.src, this.alt);
        });
    });

    function openLightbox(src, alt) {
        const lightbox = document.createElement('div');
        lightbox.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            cursor: zoom-out;
        `;

        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90vh;
            object-fit: contain;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border-radius: 8px;
        `;

        lightbox.appendChild(img);
        document.body.appendChild(lightbox);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Close on click
        lightbox.addEventListener('click', function() {
            this.remove();
            document.body.style.overflow = '';
        });

        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                lightbox.remove();
                document.body.style.overflow = '';
            }
        });
    }

    // -----------------------------------------
    // SHARE BUTTONS (Optional)
    // -----------------------------------------
    function addShareButtons() {
        const articleHero = document.querySelector('.article-hero');
        if (!articleHero) return;

        const shareContainer = document.createElement('div');
        shareContainer.className = 'share-buttons';
        shareContainer.style.cssText = `
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
        `;

        const pageUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(document.title);

        const shareLinks = [
            {
                name: 'Facebook',
                url: `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`,
                icon: 'fb'
            },
            {
                name: 'Twitter',
                url: `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`,
                icon: 'tw'
            },
            {
                name: 'LinkedIn',
                url: `https://www.linkedin.com/shareArticle?mini=true&url=${pageUrl}&title=${pageTitle}`,
                icon: 'in'
            },
            {
                name: 'WhatsApp',
                url: `https://wa.me/?text=${pageTitle}%20${pageUrl}`,
                icon: 'wa'
            }
        ];

        shareLinks.forEach(share => {
            const btn = document.createElement('a');
            btn.href = share.url;
            btn.target = '_blank';
            btn.rel = 'noopener noreferrer';
            btn.textContent = share.name;
            btn.style.cssText = `
                padding: 0.5rem 1rem;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                text-decoration: none;
                border-radius: 20px;
                font-size: 0.85rem;
                transition: background 0.2s;
            `;
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(255, 255, 255, 0.3)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(255, 255, 255, 0.2)';
            });

            shareContainer.appendChild(btn);
        });

        // articleHero.appendChild(shareContainer); // Uncomment to enable
    }

    // -----------------------------------------
    // PROGRESS BAR (Article-specific)
    // -----------------------------------------
    const articleProgressBar = document.createElement('div');
    articleProgressBar.style.cssText = `
        position: fixed;
        top: 80px;
        left: 0;
        width: 0%;
        height: 4px;
        background: var(--color-accent, #C4A962);
        z-index: 999;
        transition: width 0.1s ease;
    `;

    if (articleContent) {
        document.body.appendChild(articleProgressBar);

        window.addEventListener('scroll', function() {
            const contentStart = articleContent.offsetTop;
            const contentHeight = articleContent.offsetHeight;
            const scrolled = window.scrollY - contentStart;
            const progress = Math.min(Math.max(scrolled / contentHeight * 100, 0), 100);

            articleProgressBar.style.width = progress + '%';
        });
    }

    // -----------------------------------------
    // SMART RELATED POSTS - Dynamisch aus JSON
    // Vorberechnete Verbindungen aus data/blog-intelligence.json
    // -----------------------------------------

    // Kategorie-Anzeigenamen
    const categoryNames = {
        'achtsamkeit': 'Achtsamkeit',
        'selbstliebe': 'Selbstliebe',
        'beziehung': 'Beziehung',
        'heldinnenreise': 'Heldinnenreise',
        'hochbegabung': 'Hochbegabung',
        'koerper': 'Körper & Heilung',
        'allgemein': 'Inspiration'
    };

    // Typ-basierte Icons für Empfehlungen
    const connectionTypeIcons = {
        'vertiefung': '📚',
        'neue-perspektive': '🔮',
        'naechster-schritt': '🚀',
        'heilungsreise': '💫',
        'ergaenzung': '✨'
    };

    // Lade vorberechnete Verbindungen aus JSON
    async function loadBlogIntelligence() {
        try {
            const response = await fetch('data/blog-intelligence.json');
            if (!response.ok) throw new Error('JSON nicht gefunden');
            return await response.json();
        } catch (e) {
            console.warn('Blog-Intelligence nicht verfügbar, verwende Fallback');
            return null;
        }
    }

    // Finde aktuellen Artikel und seine vorberechneten Empfehlungen
    async function getPrecomputedRelatedPosts() {
        const data = await loadBlogIntelligence();
        if (!data || !data.articles) return null;

        const path = window.location.pathname;
        const filename = path.split('/').pop();

        // Finde aktuellen Artikel
        const currentArticle = data.articles.find(a => a.url === filename);
        if (!currentArticle || !currentArticle.related) return null;

        // Transformiere related-Daten für Anzeige
        return {
            currentArticle,
            relatedPosts: currentArticle.related.slice(0, 8).map(r => ({
                url: r.url,
                title: r.title,
                image: r.image || 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg',
                excerpt: r.excerpt || '',
                category: r.category,
                relevance: {
                    icon: connectionTypeIcons[r.type] || '✨',
                    text: r.reason || 'Empfohlen für dich'
                }
            }))
        };
    }

    function renderRelatedPosts(relatedPosts, currentArticle) {
        if (!relatedPosts || relatedPosts.length === 0) return;

        const relatedSection = document.createElement('section');
        relatedSection.className = 'related-posts';

        const categoryName = categoryNames[currentArticle?.category] || 'diesem Thema';

        relatedSection.innerHTML = `
            <div class="related-posts-header">
                <div>
                    <h3>Weiterlesen</h3>
                    <p>Weil dich ${categoryName} interessiert</p>
                </div>
                <div class="carousel-nav">
                    <button class="carousel-prev" aria-label="Zurück">←</button>
                    <button class="carousel-next" aria-label="Weiter">→</button>
                </div>
            </div>
            <div class="related-posts-carousel">
                <div class="related-posts-track">
                    ${relatedPosts.map(post => `
                        <a href="${post.url}" class="related-post-card">
                            <div class="related-post-card-image">
                                <img src="${post.image}" alt="${post.title}" loading="lazy">
                                <div class="relevance-badge">
                                    <span class="relevance-badge-icon">${post.relevance?.icon || '✨'}</span>
                                    <span class="relevance-badge-text">${post.relevance?.text || 'Empfohlen'}</span>
                                </div>
                            </div>
                            <div class="related-post-card-content">
                                <span class="related-post-category">${categoryNames[post.category] || post.category}</span>
                                <h4>${post.title}</h4>
                                <p>${post.excerpt}</p>
                                <span class="related-post-read-more">Artikel lesen</span>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
            <p class="touch-hint">← Wische für mehr Artikel →</p>
        `;

        // Einfügen vor der CTA-Section oder am Ende des Artikels
        const ctaSection = document.querySelector('.cta-section');
        const authorBio = document.querySelector('.author-bio');

        if (authorBio) {
            authorBio.after(relatedSection);
        } else if (ctaSection) {
            ctaSection.before(relatedSection);
        } else if (articleContent) {
            articleContent.after(relatedSection);
        }

        // Carousel Navigation initialisieren
        initCarouselNavigation(relatedSection);
    }

    function initCarouselNavigation(section) {
        const track = section.querySelector('.related-posts-track');
        const prevBtn = section.querySelector('.carousel-prev');
        const nextBtn = section.querySelector('.carousel-next');

        if (!track || !prevBtn || !nextBtn) return;

        const cardWidth = 344; // Card width + gap

        const updateButtons = () => {
            prevBtn.disabled = track.scrollLeft <= 10;
            nextBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 10;
        };

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -cardWidth * 2, behavior: 'smooth' });
            setTimeout(updateButtons, 400);
        });

        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: cardWidth * 2, behavior: 'smooth' });
            setTimeout(updateButtons, 400);
        });

        track.addEventListener('scroll', updateButtons);
        updateButtons();
    }

    // Related Posts initialisieren - nutzt vorberechnete Verbindungen aus JSON
    async function initRelatedPosts() {
        if (!articleContent) return;

        // Versuche vorberechnete Daten zu laden
        const precomputed = await getPrecomputedRelatedPosts();

        if (precomputed && precomputed.relatedPosts.length > 0) {
            // Nutze die intelligenten, vorberechneten Verbindungen
            renderRelatedPosts(precomputed.relatedPosts, precomputed.currentArticle);
            console.log('✓ Smart Related Posts aus JSON geladen');
        } else {
            // Fallback: Kategorie-basierte Empfehlungen
            const categorySpan = document.querySelector('.article-category');
            if (categorySpan) {
                const categoryText = categorySpan.textContent.toLowerCase().trim();
                const categoryMap = {
                    'achtsamkeit': 'achtsamkeit',
                    'selbstliebe': 'selbstliebe',
                    'beziehung': 'beziehung',
                    'heldinnenreise': 'heldinnenreise',
                    'hochbegabung': 'hochbegabung',
                    'körper': 'koerper',
                    'koerper': 'koerper',
                    'körper & heilung': 'koerper',
                    'allgemein': 'achtsamkeit'
                };
                const category = categoryMap[categoryText] || 'achtsamkeit';

                // Lade JSON für Fallback-Suche
                const data = await loadBlogIntelligence();
                if (data && data.articles) {
                    // Filtere Artikel nach Kategorie
                    const sameCategoryPosts = data.articles
                        .filter(a => a.category === category && a.url !== window.location.pathname.split('/').pop())
                        .slice(0, 8)
                        .map(a => ({
                            url: a.url,
                            title: a.title,
                            image: a.image || 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg',
                            excerpt: a.excerpt || '',
                            category: a.category,
                            relevance: {
                                icon: '📚',
                                text: 'Mehr zu diesem Thema'
                            }
                        }));

                    if (sameCategoryPosts.length > 0) {
                        renderRelatedPosts(sameCategoryPosts, { category });
                        console.log('✓ Kategorie-basierte Related Posts geladen');
                    }
                }
            }
        }
    }

    // Starte async Initialisierung
    initRelatedPosts();

    console.log('✓ Blog Enhancements geladen');
});
