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
    // SMART RELATED POSTS
    // -----------------------------------------

    // Blog-Artikel Datenbank mit Kategorien und Metadaten
    const blogDatabase = [
        // ACHTSAMKEIT
        { url: 'angst-und-achtsamkeit.html', title: 'Angst, Achtsamkeit und Frieden', category: 'achtsamkeit', tags: ['angst', 'frieden', 'pferde'], image: 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg', excerpt: 'Wie du mit Angst umgehen und durch Achtsamkeit inneren Frieden finden kannst.' },
        { url: 'achtsamkeit-sinne.html', title: 'Mit allen Sinnen: Achtsamkeit', category: 'achtsamkeit', tags: ['sinne', 'praesenz', 'alltag'], image: 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg', excerpt: 'Entdecke, wie du durch deine Sinne mehr Präsenz im Alltag finden kannst.' },
        { url: 'sonnenuntergang-grignan.html', title: 'Achtsamkeit mit dem Handy - Sonnenuntergang in Grignan', category: 'achtsamkeit', tags: ['moment', 'fotografie', 'praesenz'], image: 'wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg', excerpt: 'Wie ein Sonnenuntergang mich lehrte, den Moment wirklich zu erleben.' },
        { url: 'stille-heilung.html', title: 'Stille ist Heilung', category: 'achtsamkeit', tags: ['stille', 'heilung', 'ruhe'], image: 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg', excerpt: 'Über die transformative Kraft der Stille und warum wir sie so dringend brauchen.' },
        { url: 'qarrtsiluni.html', title: 'Qarrtsiluni - Neues entsteht in der Stille', category: 'achtsamkeit', tags: ['stille', 'neubeginn', 'dunkelheit'], image: 'wp-content/uploads/2023/10/Reisefotografie-Portugal-Alentejo_KathrinStahlPhotographer-13-300x300.jpg', excerpt: 'Ein Inuit-Wort, das beschreibt, wie Neues in der Dunkelheit und Stille entsteht.' },
        { url: 'freude-wegweiser.html', title: 'Freude als Wegweiser', category: 'achtsamkeit', tags: ['freude', 'intuition', 'leben'], image: 'wp-content/uploads/2020/10/Mirmande-Photographe-Kathrin-Stahl-Photographer-3.jpg', excerpt: 'Was passiert, wenn wir der Freude folgen statt der Pflicht?' },
        { url: 'angst-achtsamkeit-und-frieden.html', title: 'Angst, Achtsamkeit und Frieden', category: 'achtsamkeit', tags: ['angst', 'pferde', 'stress'], image: 'wp-content/uploads/2022/03/Pferdegestuetzt-Coaching-Achtsamkeit-scaled.jpg', excerpt: 'Was uns Pferde über den Umgang mit Stress und Angst lehren.' },

        // SELBSTLIEBE
        { url: 'dankbarkeit.html', title: 'Dankbarkeit in schweren Zeiten', category: 'selbstliebe', tags: ['dankbarkeit', 'schwierig', 'kraft'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Wie Dankbarkeit uns auch in schwierigen Momenten trägt.' },
        { url: 'einzigartigkeit.html', title: 'Deine Einzigartigkeit', category: 'selbstliebe', tags: ['besonders', 'geschenk', 'identitaet'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Warum deine Besonderheit dein größtes Geschenk ist.' },
        { url: 'fehler-selbstwert.html', title: 'Über Fehler und deinen Selbstwert', category: 'selbstliebe', tags: ['fehler', 'wachstum', 'selbstwert'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Wie du lernst, Fehler als Teil deines Wachstums zu sehen.' },
        { url: 'verlass-dich-nicht.html', title: 'Verlass dich nicht', category: 'selbstliebe', tags: ['treue', 'selbst', 'beziehung'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Über die wichtigste Beziehung in deinem Leben – die zu dir selbst.' },
        { url: 'es-ist-okay.html', title: 'Es ist okay', category: 'selbstliebe', tags: ['akzeptanz', 'gefuehle', 'erlaubnis'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Warum es okay ist, nicht okay zu sein.' },
        { url: 'selbstvergessen.html', title: 'Selbstvergessen', category: 'selbstliebe', tags: ['vergessen', 'praesenz', 'flow'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Die Schönheit des Selbstvergessenheit im Flow.' },
        { url: 'grenzen-setzen.html', title: 'Wie du gesunde Grenzen setzen kannst', category: 'selbstliebe', tags: ['grenzen', 'nein', 'selbstfuersorge'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Gesunde Grenzen setzen ohne schlechtes Gewissen.' },
        { url: 'wer-bist-du.html', title: 'Wer bist du, wenn du niemand sein musst?', category: 'selbstliebe', tags: ['identitaet', 'sein', 'freiheit'], image: 'wp-content/uploads/2021/04/Me-ich-Kathrin-Hogaza-1060x1042.jpg', excerpt: 'Eine Frage, die alles verändert.' },

        // BEZIEHUNG
        { url: 'beziehungsprobleme.html', title: 'Beziehungsprobleme', category: 'beziehung', tags: ['probleme', 'partnerschaft', 'kommunikation'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Wenn die Liebe kriselt – was tun bei Beziehungsproblemen?' },
        { url: 'ehe-retten.html', title: 'Ehe retten', category: 'beziehung', tags: ['ehe', 'krise', 'rettung'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Ist deine Ehe noch zu retten? Wege aus der Krise.' },
        { url: 'gehen-oder-bleiben.html', title: 'Gehen oder Bleiben?', category: 'beziehung', tags: ['trennung', 'entscheidung', 'zweifel'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Die schwierigste Frage in einer Beziehung.' },
        { url: 'love-letters.html', title: 'Love Letters', category: 'beziehung', tags: ['liebe', 'schreiben', 'verbindung'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Die Kraft von Liebesbriefen für deine Beziehung.' },
        { url: 'gemeinsam-jammern.html', title: 'Gemeinsam Jammern', category: 'beziehung', tags: ['kommunikation', 'unzufriedenheit', 'muster'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Wenn Jammern zur Gewohnheit wird.' },

        // HELDINNENREISE
        { url: 'heldinnenreise.html', title: 'Gib deinem Leben deinen Sinn', category: 'heldinnenreise', tags: ['sinn', 'reise', 'transformation'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Die Heldinnenreise – dein Weg zu einem sinnerfüllten Leben.' },
        { url: 'herzenswunsch.html', title: 'Folge deiner Sehnsucht', category: 'heldinnenreise', tags: ['sehnsucht', 'herz', 'mut'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Was passiert, wenn du deinem Herzenswunsch folgst?' },
        { url: 'leben-planen.html', title: 'Leben planen', category: 'heldinnenreise', tags: ['planung', 'ziele', 'zukunft'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Kann man sein Leben planen – und sollte man es?' },
        { url: 'komfortzone.html', title: 'Über Gewohnheiten und das Verlassen der Komfortzone', category: 'heldinnenreise', tags: ['komfortzone', 'gewohnheiten', 'mut'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Warum Wachstum außerhalb der Komfortzone beginnt.' },
        { url: 'freiheit-kopf.html', title: 'Freiheit ist niemals größer als der Kopf, der sie denkt', category: 'heldinnenreise', tags: ['freiheit', 'denken', 'grenzen'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Über die Grenzen, die wir uns selbst setzen.' },
        { url: 'was-ist-wichtig.html', title: 'Was ist wirklich wichtig?', category: 'heldinnenreise', tags: ['prioritaeten', 'werte', 'leben'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Die Frage, die alles sortiert.' },
        { url: 'erfuelltes-leben.html', title: 'Wie fühlt sich ein erfülltes Leben an?', category: 'heldinnenreise', tags: ['erfuellung', 'glueck', 'sinn'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Auf der Suche nach dem erfüllten Leben.' },
        { url: 'wo-ich-bin.html', title: 'Wo ich bin, will ich ganz sein', category: 'heldinnenreise', tags: ['praesenz', 'ganz', 'sein'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Über die Kunst, wirklich da zu sein.' },
        { url: 'wunschlos-gluecklich.html', title: 'Wunschlos glücklich? Schade eigentlich.', category: 'heldinnenreise', tags: ['wuensche', 'glueck', 'sehnsucht'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Warum Wünsche wichtig sind.' },
        { url: 'innerer-frieden.html', title: 'Endlich innerer Frieden', category: 'heldinnenreise', tags: ['frieden', 'ruhe', 'inneres'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Der Weg zum inneren Frieden.' },
        { url: 'vision-board.html', title: 'Deine Vision noch schöner mit einem Vision Board', category: 'heldinnenreise', tags: ['vision', 'kreativitaet', 'ziele'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Wie ein Vision Board deine Träume sichtbar macht.' },
        { url: 'letzte-male.html', title: 'Letzte Male - Abschied', category: 'heldinnenreise', tags: ['abschied', 'loslassen', 'veraenderung'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Über die Schönheit und den Schmerz der letzten Male.' },

        // HOCHBEGABUNG
        { url: 'hochbegabung-hochsensibilitaet.html', title: 'Hochbegabung & Hochsensibilität', category: 'hochbegabung', tags: ['hsp', 'hochbegabung', 'anders'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Wenn du anders fühlst und denkst als andere.' },
        { url: 'geschenk-wut.html', title: 'Das Geschenk deiner Wut', category: 'hochbegabung', tags: ['wut', 'gefuehle', 'kraft'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Warum Wut ein wichtiger Wegweiser sein kann.' },
        { url: 'angst-vor-power.html', title: 'Die Angst vor deiner Power', category: 'hochbegabung', tags: ['angst', 'kraft', 'potential'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Wenn wir Angst vor unserer eigenen Größe haben.' },
        { url: 'gedankenkarussell.html', title: 'Gedankenkarussell', category: 'hochbegabung', tags: ['gedanken', 'kreisen', 'kopf'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Wenn die Gedanken nicht zur Ruhe kommen.' },
        { url: 'glaubenssatzarbeit.html', title: 'Glaubenssatzarbeit', category: 'hochbegabung', tags: ['glaubenssaetze', 'veraenderung', 'ueberzeugungen'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Wie deine Überzeugungen dein Leben formen.' },
        { url: 'innere-fuehrung.html', title: 'Innere Führung', category: 'hochbegabung', tags: ['intuition', 'fuehrung', 'inneres'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Die Stimme in dir, die den Weg kennt.' },
        { url: 'gefuehle-achtsam.html', title: 'Achtsam mit deinen Gefühlen umgehen', category: 'hochbegabung', tags: ['gefuehle', 'achtsamkeit', 'umgang'], image: 'wp-content/uploads/2024/05/hochbegabt-hochsensibel-550x550.jpg', excerpt: 'Wie du achtsam mit deinen Gefühlen umgehen kannst.' },

        // KÖRPER & HEILUNG
        { url: 'klossgefuehl-hals.html', title: 'Kloßgefühl im Hals', category: 'koerper', tags: ['koerper', 'symptome', 'aufstellung'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Wie eine Aufstellung bei körperlichen Symptomen hilft.' },
        { url: 'nackenschmerzen.html', title: 'Nackenschmerzen - Symptome als Wegweiser', category: 'koerper', tags: ['schmerzen', 'koerper', 'botschaft'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Was dir dein Körper mit Schmerzen sagen will.' },
        { url: 'wen-ziehst-du.html', title: 'Wen ziehst du hinter dir her?', category: 'koerper', tags: ['last', 'vergangenheit', 'loslassen'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Über die unsichtbaren Lasten, die wir tragen.' },
        { url: 'liebe-pferde.html', title: 'Die Liebe der Pferde', category: 'koerper', tags: ['pferde', 'liebe', 'heilung'], image: 'wp-content/uploads/2025/07/PferdegestuetzteBegleitung-Retreat-Portugal-Kathrin-Stahl-29-scaled.jpg', excerpt: 'Was Pferde uns über bedingungslose Liebe lehren.' },
        { url: 'pferde-heilen.html', title: 'Mit Pferden sein und heilen', category: 'koerper', tags: ['pferde', 'heilung', 'coaching'], image: 'wp-content/uploads/2025/07/PferdegestuetzteBegleitung-Retreat-Portugal-Kathrin-Stahl-29-scaled.jpg', excerpt: 'Die heilende Kraft der Begegnung mit Pferden.' },
        { url: 'hilfe-annehmen.html', title: 'Hilfe annehmen', category: 'koerper', tags: ['hilfe', 'annehmen', 'schwaeche'], image: 'wp-content/uploads/2024/04/Wer-bin-ich-Lebensfreude-Coaching-4-1.jpg', excerpt: 'Warum Hilfe annehmen keine Schwäche ist.' }
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

    function getCurrentArticleInfo() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return blogDatabase.find(article => article.url === filename);
    }

    function findRelatedPosts(currentArticle, count = 3) {
        if (!currentArticle) return [];

        // Score-basiertes Matching
        const scored = blogDatabase
            .filter(article => article.url !== currentArticle.url) // Aktuellen Artikel ausschließen
            .map(article => {
                let score = 0;

                // Gleiche Kategorie = hohe Relevanz
                if (article.category === currentArticle.category) {
                    score += 10;
                }

                // Gemeinsame Tags = mittlere Relevanz
                const commonTags = article.tags.filter(tag => currentArticle.tags.includes(tag));
                score += commonTags.length * 5;

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
                    score += 3;
                }

                return { ...article, score };
            })
            .sort((a, b) => b.score - a.score);

        // Top N Artikel zurückgeben, mit etwas Variation
        const topArticles = scored.slice(0, Math.min(count * 2, scored.length));

        // Wenn genug Artikel, etwas Zufall hinzufügen für Abwechslung
        if (topArticles.length > count) {
            // Shuffle die Top-Kandidaten leicht
            for (let i = topArticles.length - 1; i > 0; i--) {
                if (Math.random() > 0.7) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [topArticles[i], topArticles[j]] = [topArticles[j], topArticles[i]];
                }
            }
        }

        return topArticles.slice(0, count);
    }

    function renderRelatedPosts(relatedPosts) {
        if (!relatedPosts || relatedPosts.length === 0) return;

        const relatedSection = document.createElement('section');
        relatedSection.className = 'related-posts';

        relatedSection.innerHTML = `
            <h3>Weiterlesen</h3>
            <div class="related-posts-grid">
                ${relatedPosts.map(post => `
                    <a href="${post.url}" class="related-post-card">
                        <img src="${post.image}" alt="${post.title}" loading="lazy">
                        <div class="related-post-card-content">
                            <span class="related-post-category">${categoryNames[post.category] || post.category}</span>
                            <h4>${post.title}</h4>
                            <p>${post.excerpt}</p>
                            <span class="related-post-read-more">Artikel lesen</span>
                        </div>
                    </a>
                `).join('')}
            </div>
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
    }

    // Related Posts initialisieren
    if (articleContent) {
        const currentArticle = getCurrentArticleInfo();
        if (currentArticle) {
            const relatedPosts = findRelatedPosts(currentArticle, 3);
            renderRelatedPosts(relatedPosts);
        } else {
            // Fallback: Zeige zufällige Artikel aus derselben Kategorie
            // Versuche Kategorie aus der Seite zu extrahieren
            const categorySpan = document.querySelector('.article-category');
            if (categorySpan) {
                const categoryText = categorySpan.textContent.toLowerCase();
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

                const fallbackPosts = blogDatabase
                    .filter(article => article.category === category && article.url !== filename)
                    .slice(0, 3);

                if (fallbackPosts.length > 0) {
                    renderRelatedPosts(fallbackPosts);
                }
            }
        }
    }

    console.log('✓ Blog Enhancements geladen');
});
