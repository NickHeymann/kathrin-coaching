// videos.js - Video-Logik für media.html
// YouTube Channel ID
const CHANNEL_ID = 'UCxjysqaDv62bNh5bwaHLIbQ';

// State
let allVideos = [];
let displayedVideos = 0;
const VIDEOS_PER_PAGE = 12;

// Eingebettete Video-Daten aus JSON laden
async function loadVideoData() {
    try {
        const response = await fetch('/data/videos.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const videos = await response.json();
        return videos.map(video => ({
            id: video.id,
            title: video.title,
            description: video.description,
            publishedAt: new Date(video.published),
            category: video.category || 'selbstfindung'
        }));
    } catch (error) {
        console.error('Fehler beim Laden der Video-Daten:', error);
        return [];
    }
}

// Videos laden - kombiniert eingebettete Daten mit RSS für Updates
async function loadYouTubeVideos() {
    const grid = document.getElementById('videoGrid');

    try {
        // Video-Daten aus JSON laden
        allVideos = await loadVideoData();

        if (allVideos.length === 0) {
            throw new Error('Keine Video-Daten verfügbar');
        }

        // Versuche RSS für neueste Videos zu laden (könnte neuere haben)
        try {
            const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
            const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();

            if (data.status === 'ok' && data.items) {
                // Neue Videos hinzufügen, die nicht in den geladenen Daten sind
                const existingIds = new Set(allVideos.map(v => v.id));
                const newVideos = data.items
                    .filter(item => {
                        const videoId = item.link.split('v=')[1] || item.guid.split(':').pop();
                        return !existingIds.has(videoId);
                    })
                    .map(item => {
                        const videoId = item.link.split('v=')[1] || item.guid.split(':').pop();
                        return {
                            id: videoId,
                            title: item.title,
                            description: item.description || '',
                            publishedAt: new Date(item.pubDate),
                            category: 'selbstfindung' // Default für neue Videos
                        };
                    });

                // Neue Videos an den Anfang
                allVideos = [...newVideos, ...allVideos];
            }
        } catch (rssError) {
            console.log('RSS nicht verfügbar, nutze JSON Daten');
        }

        // Nach Datum sortieren (neueste zuerst)
        allVideos.sort((a, b) => b.publishedAt - a.publishedAt);

        // Statistiken aktualisieren
        document.getElementById('totalVideos').textContent = `${allVideos.length} Videos`;
        document.getElementById('updateTime').textContent = `Aktualisiert: ${new Date().toLocaleDateString('de-DE')}`;

        // Videos anzeigen
        displayedVideos = 0;
        renderVideos();

        // Load More Button anzeigen wenn mehr Videos vorhanden
        if (allVideos.length > VIDEOS_PER_PAGE) {
            document.getElementById('loadMore').style.display = 'flex';
        }
    } catch (error) {
        console.error('Fehler beim Laden der Videos:', error);
        showFallbackVideos();
    }
}

// Videos rendern
function renderVideos(filter = 'all') {
    const grid = document.getElementById('videoGrid');
    const videosToShow = filter === 'all'
        ? allVideos
        : allVideos.filter(v => v.category === filter);

    const endIndex = Math.min(displayedVideos + VIDEOS_PER_PAGE, videosToShow.length);
    const newVideos = videosToShow.slice(0, endIndex);

    // mqdefault.jpg = 320x180 (schneller), hqdefault.jpg = 480x360 (Fallback)
    grid.innerHTML = newVideos.map((video, index) => `
        <div class="video-card" data-category="${video.category}">
            <div class="video-thumbnail" onclick="openVideo('${video.id}')">
                <img src="https://i.ytimg.com/vi/${video.id}/mqdefault.jpg"
                     alt="${escapeHtml(video.title)}"
                     loading="${index < 6 ? 'eager' : 'lazy'}"
                     decoding="async"
                     onerror="this.src='https://i.ytimg.com/vi/${video.id}/hqdefault.jpg'">
                <div class="play-btn">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
            </div>
            <div class="video-info">
                <span class="video-category">${getCategoryLabel(video.category)}</span>
                <h3>${escapeHtml(video.title)}</h3>
                <p>${escapeHtml(video.description.substring(0, 150))}${video.description.length > 150 ? '...' : ''}</p>
                <div class="video-meta">
                    <span>${formatDate(video.publishedAt)}</span>
                </div>
            </div>
        </div>
    `).join('');

    displayedVideos = endIndex;

    // Load More Button verstecken wenn alle Videos angezeigt
    const loadMoreBtn = document.getElementById('loadMore');
    if (displayedVideos >= videosToShow.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'flex';
    }
}

// Fallback: Statische Videos wenn API nicht erreichbar
function showFallbackVideos() {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = `
        <div class="error-message">
            <h3>Videos konnten nicht geladen werden</h3>
            <p>Besuche unseren YouTube-Kanal direkt:</p>
            <p><a href="https://www.youtube.com/channel/${CHANNEL_ID}" target="_blank">Glück über Zweifel auf YouTube</a></p>
        </div>
    `;

    document.getElementById('totalVideos').textContent = '–';
    document.getElementById('updateTime').textContent = '–';
}

// Mehr Videos laden
function loadMoreVideos() {
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    renderVideos(activeFilter);
}

// Filter initialisieren
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            displayedVideos = 0;
            renderVideos(filter);
        });
    });
}

// Video Modal
function openVideo(videoId) {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('modalVideo');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('modalVideo');
    iframe.src = '';
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Hilfsfunktionen
function getCategoryLabel(category) {
    const labels = {
        'beziehung': 'Beziehung',
        'selbstfindung': 'Selbstfindung',
        'hochsensibel': 'Hochsensibilität',
        'koerper': 'Körper & Heilung'
    };
    return labels[category] || 'Inspiration';
}

function formatDate(date) {
    return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners initialisieren
document.addEventListener('DOMContentLoaded', function() {
    initFilters();
    loadYouTubeVideos();

    // Modal schließen bei Klick außerhalb
    document.getElementById('videoModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeVideoModal();
        }
    });

    // CSP-safe event delegation for buttons
    document.addEventListener('click', function(e) {
        // Load more button
        if (e.target.closest('.load-more-btn')) {
            loadMoreVideos();
            return;
        }
        // Modal close button
        if (e.target.closest('.modal-close')) {
            closeVideoModal();
            return;
        }
    });

    // ESC-Taste zum Schließen
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeVideoModal();
        }
    });
});
