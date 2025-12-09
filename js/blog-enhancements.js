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
    // SMART RELATED POSTS - State of the Art
    // Netflix/Spotify inspired with smart reasons
    // -----------------------------------------

    // Blog-Artikel Datenbank mit echten Header-Bildern und Metadaten
    const blogDatabase = [
        // ACHTSAMKEIT
        { url: 'angst-achtsamkeit-und-frieden.html', title: 'Angst, Achtsamkeit und Frieden', category: 'achtsamkeit', tags: ['angst', 'frieden', 'pferde', 'praesenz'], image: 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg', excerpt: 'Wie du mit Angst umgehen und durch Achtsamkeit inneren Frieden finden kannst.', themes: ['umgang-mit-angst', 'innerer-frieden'] },
        { url: 'achtsamkeit-sinne.html', title: 'Mit allen Sinnen: Achtsamkeit', category: 'achtsamkeit', tags: ['sinne', 'praesenz', 'alltag', 'koerper'], image: 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg', excerpt: 'Entdecke, wie du durch deine Sinne mehr Präsenz im Alltag finden kannst.', themes: ['praesenz', 'koerperwahrnehmung'] },
        { url: 'sonnenuntergang-grignan.html', title: 'Achtsamkeit mit dem Handy', category: 'achtsamkeit', tags: ['moment', 'fotografie', 'praesenz'], image: 'wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg', excerpt: 'Wie ein Sonnenuntergang mich lehrte, den Moment wirklich zu erleben.', themes: ['praesenz', 'alltag'] },
        { url: 'stille-heilung.html', title: 'Stille ist Heilung', category: 'achtsamkeit', tags: ['stille', 'heilung', 'ruhe', 'inneres'], image: 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg', excerpt: 'Über die transformative Kraft der Stille und warum wir sie so dringend brauchen.', themes: ['innerer-frieden', 'heilung'] },
        { url: 'qarrtsiluni.html', title: 'Qarrtsiluni - Neues entsteht in der Stille', category: 'achtsamkeit', tags: ['stille', 'neubeginn', 'dunkelheit', 'transformation'], image: 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg', excerpt: 'Ein Inuit-Wort, das beschreibt, wie Neues in der Dunkelheit und Stille entsteht.', themes: ['transformation', 'neubeginn'] },
        { url: 'freude-wegweiser.html', title: 'Freude als Wegweiser', category: 'achtsamkeit', tags: ['freude', 'intuition', 'leben', 'gefuehle'], image: 'wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg', excerpt: 'Was passiert, wenn wir der Freude folgen statt der Pflicht?', themes: ['lebensfreude', 'intuition'] },
        { url: 'mit-allen-sinnen-achtsamkeit.html', title: 'Mit allen Sinnen achtsam sein', category: 'achtsamkeit', tags: ['sinne', 'praesenz', 'koerper'], image: 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg', excerpt: 'Wie du durch deine Sinne im Moment ankommen kannst.', themes: ['praesenz', 'koerperwahrnehmung'] },

        // SELBSTLIEBE
        { url: 'dankbarkeit.html', title: 'Dankbarkeit in schweren Zeiten', category: 'selbstliebe', tags: ['dankbarkeit', 'schwierig', 'kraft', 'resilienz'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Wie Dankbarkeit uns auch in schwierigen Momenten trägt.', themes: ['resilienz', 'perspektive'] },
        { url: 'einzigartigkeit.html', title: 'Deine Einzigartigkeit', category: 'selbstliebe', tags: ['besonders', 'geschenk', 'identitaet', 'selbstwert'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Warum deine Besonderheit dein größtes Geschenk ist.', themes: ['selbstwert', 'identitaet'] },
        { url: 'fehler-selbstwert.html', title: 'Über Fehler und deinen Selbstwert', category: 'selbstliebe', tags: ['fehler', 'wachstum', 'selbstwert', 'perfektionismus'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Wie du lernst, Fehler als Teil deines Wachstums zu sehen.', themes: ['selbstwert', 'wachstum'] },
        { url: 'verlass-dich-nicht.html', title: 'Verlass dich nicht', category: 'selbstliebe', tags: ['treue', 'selbst', 'beziehung', 'selbstfuersorge'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Über die wichtigste Beziehung in deinem Leben – die zu dir selbst.', themes: ['selbstbeziehung', 'treue'] },
        { url: 'es-ist-okay.html', title: 'Es ist okay', category: 'selbstliebe', tags: ['akzeptanz', 'gefuehle', 'erlaubnis', 'mitgefuehl'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Warum es okay ist, nicht okay zu sein.', themes: ['selbstakzeptanz', 'gefuehle'] },
        { url: 'selbstvergessen.html', title: 'Selbstvergessen', category: 'selbstliebe', tags: ['vergessen', 'praesenz', 'flow', 'freiheit'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Die Schönheit der Selbstvergessenheit im Flow.', themes: ['flow', 'praesenz'] },
        { url: 'grenzen-setzen.html', title: 'Wie du gesunde Grenzen setzen kannst', category: 'selbstliebe', tags: ['grenzen', 'nein', 'selbstfuersorge', 'beziehungen'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Gesunde Grenzen setzen ohne schlechtes Gewissen.', themes: ['grenzen', 'selbstfuersorge'] },
        { url: 'wer-bist-du.html', title: 'Wer bist du, wenn du niemand sein musst?', category: 'selbstliebe', tags: ['identitaet', 'sein', 'freiheit', 'authentizitaet'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Eine Frage, die alles verändert.', themes: ['identitaet', 'authentizitaet'] },

        // BEZIEHUNG
        { url: 'beziehungsprobleme.html', title: 'Beziehungsprobleme', category: 'beziehung', tags: ['probleme', 'partnerschaft', 'kommunikation', 'krise'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Wenn die Liebe kriselt – was tun bei Beziehungsproblemen?', themes: ['beziehungskrise', 'kommunikation'] },
        { url: 'ehe-retten.html', title: 'Ehe retten', category: 'beziehung', tags: ['ehe', 'krise', 'rettung', 'partnerschaft'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Ist deine Ehe noch zu retten? Wege aus der Krise.', themes: ['beziehungskrise', 'neuanfang'] },
        { url: 'gehen-oder-bleiben.html', title: 'Gehen oder Bleiben?', category: 'beziehung', tags: ['trennung', 'entscheidung', 'zweifel', 'klarheit'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Die schwierigste Frage in einer Beziehung.', themes: ['entscheidung', 'klarheit'] },
        { url: 'love-letters.html', title: 'Love Letters', category: 'beziehung', tags: ['liebe', 'schreiben', 'verbindung', 'kommunikation'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Die Kraft von Liebesbriefen für deine Beziehung.', themes: ['verbindung', 'kommunikation'] },
        { url: 'gemeinsam-jammern.html', title: 'Gemeinsam Jammern', category: 'beziehung', tags: ['kommunikation', 'unzufriedenheit', 'muster', 'gewohnheiten'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Wenn Jammern zur Gewohnheit wird.', themes: ['muster', 'kommunikation'] },
        { url: 'was-dein-freundeskreis-ueber-dich-verraet.html', title: 'Was dein Freundeskreis über dich verrät', category: 'beziehung', tags: ['freundschaft', 'spiegel', 'beziehungen'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Deine Freunde als Spiegel deiner Selbst.', themes: ['selbsterkenntnis', 'beziehungen'] },

        // HELDINNENREISE
        { url: 'heldinnenreise.html', title: 'Gib deinem Leben deinen Sinn', category: 'heldinnenreise', tags: ['sinn', 'reise', 'transformation', 'berufung'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Die Heldinnenreise – dein Weg zu einem sinnerfüllten Leben.', themes: ['lebenssinn', 'transformation'] },
        { url: 'herzenswunsch.html', title: 'Folge deiner Sehnsucht', category: 'heldinnenreise', tags: ['sehnsucht', 'herz', 'mut', 'traeume'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Was passiert, wenn du deinem Herzenswunsch folgst?', themes: ['herzenswunsch', 'mut'] },
        { url: 'leben-planen.html', title: 'Leben planen', category: 'heldinnenreise', tags: ['planung', 'ziele', 'zukunft', 'kontrolle'], image: 'wp-content/uploads/2025/05/Neuanfang-Umbruchphase-1024x1024.jpg', excerpt: 'Kann man sein Leben planen – und sollte man es?', themes: ['lebensplanung', 'kontrolle'] },
        { url: 'komfortzone.html', title: 'Über Gewohnheiten und das Verlassen der Komfortzone', category: 'heldinnenreise', tags: ['komfortzone', 'gewohnheiten', 'mut', 'wachstum'], image: 'wp-content/uploads/2025/05/Neuanfang-Umbruchphase-1024x1024.jpg', excerpt: 'Warum Wachstum außerhalb der Komfortzone beginnt.', themes: ['wachstum', 'mut'] },
        { url: 'freiheit.html', title: 'Freiheit ist niemals größer als der Kopf, der sie denkt', category: 'heldinnenreise', tags: ['freiheit', 'denken', 'grenzen', 'glaubenssaetze'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Über die Grenzen, die wir uns selbst setzen.', themes: ['innere-freiheit', 'glaubenssaetze'] },
        { url: 'was-ist-wichtig.html', title: 'Was ist wirklich wichtig?', category: 'heldinnenreise', tags: ['prioritaeten', 'werte', 'leben', 'klarheit'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Die Frage, die alles sortiert.', themes: ['werte', 'klarheit'] },
        { url: 'erfuelltes-leben.html', title: 'Wie fühlt sich ein erfülltes Leben an?', category: 'heldinnenreise', tags: ['erfuellung', 'glueck', 'sinn', 'zufriedenheit'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Auf der Suche nach dem erfüllten Leben.', themes: ['erfuellung', 'lebenssinn'] },
        { url: 'ganz-sein.html', title: 'Wo ich bin, will ich ganz sein', category: 'heldinnenreise', tags: ['praesenz', 'ganz', 'sein', 'achtsamkeit'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Über die Kunst, wirklich da zu sein.', themes: ['praesenz', 'authentizitaet'] },
        { url: 'wunschlos-gluecklich-schade-eigentlich.html', title: 'Wunschlos glücklich? Schade eigentlich.', category: 'heldinnenreise', tags: ['wuensche', 'glueck', 'sehnsucht', 'traeume'], image: 'wp-content/uploads/2020/10/Achtsamkeit.jpg', excerpt: 'Warum Wünsche wichtig sind.', themes: ['wuensche', 'lebenssinn'] },
        { url: 'innerer-frieden.html', title: 'Endlich innerer Frieden', category: 'heldinnenreise', tags: ['frieden', 'ruhe', 'inneres', 'heilung'], image: 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg', excerpt: 'Der Weg zum inneren Frieden.', themes: ['innerer-frieden', 'heilung'] },
        { url: 'vision-board.html', title: 'Deine Vision noch schöner', category: 'heldinnenreise', tags: ['vision', 'kreativitaet', 'ziele', 'traeume'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Wie ein Vision Board deine Träume sichtbar macht.', themes: ['vision', 'ziele'] },
        { url: 'letzte-male.html', title: 'Letzte Male - Abschied', category: 'heldinnenreise', tags: ['abschied', 'loslassen', 'veraenderung', 'trauer'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Über die Schönheit und den Schmerz der letzten Male.', themes: ['loslassen', 'veraenderung'] },
        { url: 'nichtswollen.html', title: 'Nichts wollen', category: 'heldinnenreise', tags: ['loslassen', 'akzeptanz', 'sein'], image: 'wp-content/uploads/2020/08/2018_06_Anna_Delmenhorst-146-scaled.jpg', excerpt: 'Die Freiheit im Nichts-Wollen.', themes: ['loslassen', 'freiheit'] },

        // HOCHBEGABUNG
        { url: 'hochbegabung-hochsensibel.html', title: 'Hochbegabung & Hochsensibilität', category: 'hochbegabung', tags: ['hsp', 'hochbegabung', 'anders', 'sensibilitaet'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Wenn du anders fühlst und denkst als andere.', themes: ['hochsensibilitaet', 'anderssein'] },
        { url: 'geschenk-wut.html', title: 'Das Geschenk deiner Wut', category: 'hochbegabung', tags: ['wut', 'gefuehle', 'kraft', 'emotion'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Warum Wut ein wichtiger Wegweiser sein kann.', themes: ['emotionen', 'kraft'] },
        { url: 'die-angst-vor-deiner-power.html', title: 'Die Angst vor deiner Power', category: 'hochbegabung', tags: ['angst', 'kraft', 'potential', 'groesse'], image: 'wp-content/uploads/2021/12/PferdegestuetztePersoenlichkeitsentwicklung-Hamburg-scaled.jpg', excerpt: 'Wenn wir Angst vor unserer eigenen Größe haben.', themes: ['potential', 'selbstsabotage'] },
        { url: 'gedankenkarussell.html', title: 'Gedankenkarussell', category: 'hochbegabung', tags: ['gedanken', 'kreisen', 'kopf', 'grübeln'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Wenn die Gedanken nicht zur Ruhe kommen.', themes: ['gedanken', 'ruhe'] },
        { url: 'glaubenssaetze-pferde.html', title: 'Glaubenssatzarbeit mit Pferden', category: 'hochbegabung', tags: ['glaubenssaetze', 'veraenderung', 'ueberzeugungen', 'pferde'], image: 'wp-content/uploads/2022/07/Coaching-Pferde-Hamburg-KathrinStahl-17-550x550.jpg', excerpt: 'Wie deine Überzeugungen dein Leben formen.', themes: ['glaubenssaetze', 'veraenderung'] },
        { url: 'innere-fuehrung.html', title: 'Innere Führung', category: 'hochbegabung', tags: ['intuition', 'fuehrung', 'inneres', 'weisheit'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Die Stimme in dir, die den Weg kennt.', themes: ['intuition', 'innere-weisheit'] },
        { url: 'gefuehle-achtsam.html', title: 'Achtsam mit deinen Gefühlen umgehen', category: 'hochbegabung', tags: ['gefuehle', 'achtsamkeit', 'umgang', 'emotion'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Wie du achtsam mit deinen Gefühlen umgehen kannst.', themes: ['emotionen', 'achtsamkeit'] },
        { url: 'hochbegabt.html', title: 'Hochbegabt sein', category: 'hochbegabung', tags: ['hochbegabung', 'anderssein', 'potential'], image: 'wp-content/uploads/2022/02/PferdegestuetztesCoaching-Hochbegabung-Hamburg.jpg', excerpt: 'Was es bedeutet, hochbegabt zu sein.', themes: ['hochbegabung', 'identitaet'] },

        // KÖRPER & HEILUNG
        { url: 'klossgefuehl-im-hals-wie-eine-aufstellung-hilft.html', title: 'Kloßgefühl im Hals', category: 'koerper', tags: ['koerper', 'symptome', 'aufstellung', 'heilung'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Wie eine Aufstellung bei körperlichen Symptomen hilft.', themes: ['koerpersymptome', 'aufstellung'] },
        { url: 'nackenschmerzen.html', title: 'Nackenschmerzen als Wegweiser', category: 'koerper', tags: ['schmerzen', 'koerper', 'botschaft', 'symptome'], image: 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg', excerpt: 'Was dir dein Körper mit Schmerzen sagen will.', themes: ['koerpersymptome', 'botschaft'] },
        { url: 'wen-ziehst-du.html', title: 'Wen ziehst du hinter dir her?', category: 'koerper', tags: ['last', 'vergangenheit', 'loslassen', 'familie'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Über die unsichtbaren Lasten, die wir tragen.', themes: ['systemisch', 'loslassen'] },
        { url: 'die-liebe-der-pferde.html', title: 'Die Liebe der Pferde', category: 'koerper', tags: ['pferde', 'liebe', 'heilung', 'verbindung'], image: 'wp-content/uploads/2023/06/Pferde-Coaching-Hamburg-1024x823.png', excerpt: 'Was Pferde uns über bedingungslose Liebe lehren.', themes: ['pferde', 'liebe'] },
        { url: 'mit-pferden-sein-und-heilen.html', title: 'Mit Pferden sein und heilen', category: 'koerper', tags: ['pferde', 'heilung', 'coaching', 'praesenz'], image: 'wp-content/uploads/2021/01/Pferdegestütztes-Coaching-scaled.jpg', excerpt: 'Die heilende Kraft der Begegnung mit Pferden.', themes: ['pferde', 'heilung'] },
        { url: 'hilfe-annehmen.html', title: 'Hilfe annehmen', category: 'koerper', tags: ['hilfe', 'annehmen', 'schwaeche', 'staerke'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Warum Hilfe annehmen keine Schwäche ist.', themes: ['selbstfuersorge', 'verletzlichkeit'] }
    ];

    // Kategorie-Anzeigenamen
    const categoryNames = {
        'achtsamkeit': 'Achtsamkeit',
        'selbstliebe': 'Selbstliebe',
        'beziehung': 'Beziehung',
        'heldinnenreise': 'Heldinnenreise',
        'hochbegabung': 'Hochbegabung',
        'koerper': 'Körper & Heilung'
    };

    // Smarte Begründungen warum ein Artikel relevant ist
    const relevanceReasons = {
        sameCategory: [
            { icon: '📚', text: 'Mehr zu diesem Thema' },
            { icon: '🔍', text: 'Vertieft dieses Thema' },
            { icon: '💡', text: 'Ein weiterer Blick auf {category}' }
        ],
        commonTags: [
            { icon: '🔗', text: 'Passt zu deinem Interesse an {tag}' },
            { icon: '✨', text: 'Weil dich {tag} interessiert' },
            { icon: '🌟', text: 'Auch über {tag}' }
        ],
        commonThemes: [
            { icon: '🧭', text: 'Ein anderer Blickwinkel' },
            { icon: '💫', text: 'Ergänzt deine Lektüre' },
            { icon: '🌱', text: 'Der nächste Schritt auf deiner Reise' }
        ],
        relatedCategory: [
            { icon: '🌈', text: 'Könnte dich auch interessieren' },
            { icon: '🔮', text: 'Eine neue Perspektive' },
            { icon: '🦋', text: 'Verwandtes Thema' }
        ],
        nextStep: [
            { icon: '→', text: 'Dein nächster Schritt' },
            { icon: '🚀', text: 'Geh noch tiefer' },
            { icon: '🌿', text: 'Führt dich weiter' }
        ]
    };

    // Thema-Verknüpfungen für "nächster Schritt" Logik
    const themeJourneys = {
        'umgang-mit-angst': ['innerer-frieden', 'mut', 'selbstvertrauen'],
        'innerer-frieden': ['praesenz', 'heilung', 'achtsamkeit'],
        'selbstwert': ['authentizitaet', 'grenzen', 'selbstbeziehung'],
        'beziehungskrise': ['kommunikation', 'selbstbeziehung', 'klarheit'],
        'hochsensibilitaet': ['selbstfuersorge', 'grenzen', 'emotionen'],
        'transformation': ['neubeginn', 'loslassen', 'mut'],
        'wachstum': ['komfortzone', 'mut', 'potential']
    };

    function getCurrentArticleInfo() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return blogDatabase.find(article => article.url === filename);
    }

    function getRelevanceReason(article, currentArticle) {
        // Priorisierte Logik für die Begründung

        // 1. Gleiche Kategorie
        if (article.category === currentArticle.category) {
            const reasons = relevanceReasons.sameCategory;
            const reason = reasons[Math.floor(Math.random() * reasons.length)];
            return {
                icon: reason.icon,
                text: reason.text.replace('{category}', categoryNames[article.category])
            };
        }

        // 2. Gemeinsame Tags
        const commonTags = article.tags.filter(tag => currentArticle.tags.includes(tag));
        if (commonTags.length > 0) {
            const tagDisplayNames = {
                'angst': 'Angst', 'frieden': 'Frieden', 'pferde': 'Pferde',
                'praesenz': 'Präsenz', 'heilung': 'Heilung', 'stille': 'Stille',
                'gefuehle': 'Gefühle', 'selbstwert': 'Selbstwert', 'mut': 'Mut',
                'grenzen': 'Grenzen', 'intuition': 'Intuition', 'transformation': 'Transformation'
            };
            const tag = commonTags[0];
            const displayTag = tagDisplayNames[tag] || tag;
            const reasons = relevanceReasons.commonTags;
            const reason = reasons[Math.floor(Math.random() * reasons.length)];
            return {
                icon: reason.icon,
                text: reason.text.replace('{tag}', displayTag)
            };
        }

        // 3. Thematischer "nächster Schritt"
        if (currentArticle.themes && article.themes) {
            for (const theme of currentArticle.themes) {
                const nextThemes = themeJourneys[theme] || [];
                if (article.themes.some(t => nextThemes.includes(t))) {
                    const reasons = relevanceReasons.nextStep;
                    return reasons[Math.floor(Math.random() * reasons.length)];
                }
            }
        }

        // 4. Verwandte Kategorie
        const relatedCategories = {
            'achtsamkeit': ['selbstliebe', 'koerper', 'hochbegabung'],
            'selbstliebe': ['achtsamkeit', 'heldinnenreise', 'beziehung'],
            'beziehung': ['selbstliebe', 'hochbegabung', 'achtsamkeit'],
            'heldinnenreise': ['selbstliebe', 'hochbegabung', 'achtsamkeit'],
            'hochbegabung': ['selbstliebe', 'achtsamkeit', 'koerper'],
            'koerper': ['achtsamkeit', 'hochbegabung', 'heilung']
        };

        if (relatedCategories[currentArticle.category]?.includes(article.category)) {
            const reasons = relevanceReasons.relatedCategory;
            return reasons[Math.floor(Math.random() * reasons.length)];
        }

        // Fallback
        return { icon: '✨', text: 'Könnte dich inspirieren' };
    }

    function findRelatedPosts(currentArticle, count = 8) {
        if (!currentArticle) return [];

        // Score-basiertes Matching mit erweiterter Logik
        const scored = blogDatabase
            .filter(article => article.url !== currentArticle.url)
            .map(article => {
                let score = 0;

                // Gleiche Kategorie = hohe Relevanz
                if (article.category === currentArticle.category) {
                    score += 15;
                }

                // Gemeinsame Tags = mittlere Relevanz
                const commonTags = article.tags.filter(tag => currentArticle.tags.includes(tag));
                score += commonTags.length * 6;

                // Gemeinsame Themes = hohe Relevanz
                if (currentArticle.themes && article.themes) {
                    const commonThemes = article.themes.filter(t => currentArticle.themes.includes(t));
                    score += commonThemes.length * 8;
                }

                // Thematische Reise - "nächster Schritt"
                if (currentArticle.themes && article.themes) {
                    for (const theme of currentArticle.themes) {
                        const nextThemes = themeJourneys[theme] || [];
                        if (article.themes.some(t => nextThemes.includes(t))) {
                            score += 10;
                        }
                    }
                }

                // Verwandte Kategorien
                const relatedCategories = {
                    'achtsamkeit': ['selbstliebe', 'koerper'],
                    'selbstliebe': ['achtsamkeit', 'heldinnenreise'],
                    'beziehung': ['selbstliebe', 'hochbegabung'],
                    'heldinnenreise': ['selbstliebe', 'hochbegabung'],
                    'hochbegabung': ['selbstliebe', 'achtsamkeit'],
                    'koerper': ['achtsamkeit', 'hochbegabung']
                };

                if (relatedCategories[currentArticle.category]?.includes(article.category)) {
                    score += 5;
                }

                // Relevanz-Grund berechnen
                const relevance = getRelevanceReason(article, currentArticle);

                return { ...article, score, relevance };
            })
            .sort((a, b) => b.score - a.score);

        // Diversität sicherstellen - nicht nur eine Kategorie
        const result = [];
        const usedCategories = new Set();
        const topCandidates = scored.slice(0, count * 3);

        // Erst die Top 3 aus gleicher Kategorie
        for (const article of topCandidates) {
            if (result.length >= 3) break;
            if (article.category === currentArticle.category) {
                result.push(article);
                usedCategories.add(article.category);
            }
        }

        // Dann aus anderen Kategorien auffüllen
        for (const article of topCandidates) {
            if (result.length >= count) break;
            if (!result.includes(article)) {
                result.push(article);
                usedCategories.add(article.category);
            }
        }

        return result;
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

    // Related Posts initialisieren
    if (articleContent) {
        const currentArticle = getCurrentArticleInfo();
        if (currentArticle) {
            const relatedPosts = findRelatedPosts(currentArticle, 8);
            renderRelatedPosts(relatedPosts, currentArticle);
        } else {
            // Fallback: Versuche Kategorie aus der Seite zu extrahieren
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
                const path = window.location.pathname;
                const filename = path.split('/').pop();

                // Erstelle ein Pseudo-Artikel-Objekt für die Logik
                const pseudoArticle = {
                    url: filename,
                    category: category,
                    tags: [],
                    themes: []
                };

                const fallbackPosts = findRelatedPosts(pseudoArticle, 8);

                if (fallbackPosts.length > 0) {
                    renderRelatedPosts(fallbackPosts, pseudoArticle);
                }
            }
        }
    }

    console.log('✓ Blog Enhancements geladen');
});
