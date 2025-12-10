/* blog-editor-config.js
 * Zentrale Konfiguration für Blog-Editor
 * Zeilen: ~50 | Verantwortung: Config & Constants
 */

// GitHub Repository Konfiguration
const CONFIG = {
    owner: 'nickheymann',
    repo: 'kathrin-coaching',
    branch: 'main',
    blogPath: 'blog/',
    imagesPath: 'assets/images/blog/'
};

// Blog-Kategorien (Haupt-Kategorien)
const CATEGORIES = [
    { id: 'achtsamkeit', label: 'Achtsamkeit', description: 'Präsenz, innere Ruhe, Momente, Meditation' },
    { id: 'selbstliebe', label: 'Selbstliebe', description: 'Selbstakzeptanz, Selbstwert, innerer Kritiker' },
    { id: 'beziehung', label: 'Beziehung', description: 'Partnerschaft, Nähe, Liebe, Kommunikation' },
    { id: 'heldinnenreise', label: 'Heldinnenreise', description: 'Persönliche Transformation, Neuanfang' },
    { id: 'hochbegabung', label: 'Hochbegabung', description: 'Hochsensibilität, anders sein, Überreizung' },
    { id: 'koerper', label: 'Körper & Nervensystem', description: 'Nervensystem, Körperarbeit, somatische Erfahrung' }
];

// Blog-Kategorien als Object für schnellen Lookup
const BLOG_CATEGORIES = {
    achtsamkeit: 'Achtsamkeit',
    selbstliebe: 'Selbstliebe',
    beziehung: 'Beziehung',
    heldinnenreise: 'Heldinnenreise',
    hochbegabung: 'Hochbegabung',
    koerper: 'Körper & Nervensystem'
};

// Post-Templates für neue Beiträge
const POST_TEMPLATES = [
    {
        id: 'blank',
        name: 'Leerer Beitrag',
        icon: '📄',
        description: 'Starte mit einer leeren Seite',
        blocks: [
            { type: 'text', content: '<p>Beginne hier mit deinem Beitrag...</p>' }
        ]
    },
    {
        id: 'article',
        name: 'Blog-Artikel',
        icon: '📝',
        description: 'Klassischer Artikel mit Einleitung, Hauptteil und Fazit',
        blocks: [
            { type: 'text', content: '<p><em>Kurze Einleitung: Worum geht es? Warum ist das Thema wichtig?</em></p>' },
            { type: 'heading', content: '<h2>Das Problem</h2>' },
            { type: 'text', content: '<p>Beschreibe hier das Problem oder die Herausforderung, die deine Leser:innen kennen...</p>' },
            { type: 'heading', content: '<h2>Die Lösung</h2>' },
            { type: 'text', content: '<p>Erkläre deinen Ansatz und wie er helfen kann...</p>' },
            { type: 'heading', content: '<h2>Fazit</h2>' },
            { type: 'text', content: '<p>Fasse die wichtigsten Punkte zusammen und gib einen klaren Call-to-Action...</p>' }
        ]
    },
    {
        id: 'howto',
        name: 'How-To Anleitung',
        icon: '📋',
        description: 'Schritt-für-Schritt Anleitung',
        blocks: [
            { type: 'text', content: '<p><strong>Was du lernen wirst:</strong> Eine kurze Übersicht...</p>' },
            { type: 'heading', content: '<h2>Schritt 1: [Erster Schritt]</h2>' },
            { type: 'text', content: '<p>Beschreibe den ersten Schritt im Detail...</p>' },
            { type: 'heading', content: '<h2>Schritt 2: [Zweiter Schritt]</h2>' },
            { type: 'text', content: '<p>Beschreibe den zweiten Schritt im Detail...</p>' },
            { type: 'heading', content: '<h2>Schritt 3: [Dritter Schritt]</h2>' },
            { type: 'text', content: '<p>Beschreibe den dritten Schritt im Detail...</p>' },
            { type: 'callout', content: '<div class="callout">💡 <strong>Profi-Tipp:</strong> Ein besonders hilfreicher Hinweis...</div>' }
        ]
    },
    {
        id: 'coaching-tip',
        name: 'Coaching-Tipp',
        icon: '💡',
        description: 'Kurzer, praktischer Impuls',
        blocks: [
            { type: 'quote', content: '<blockquote>"Ein inspirierendes Zitat zum Thema..."</blockquote>' },
            { type: 'text', content: '<p>Hast du dich auch schon mal gefragt, warum...?</p>' },
            { type: 'heading', content: '<h2>Der Impuls</h2>' },
            { type: 'text', content: '<p>Erkläre den Kerngedanken oder die Erkenntnis...</p>' },
            { type: 'callout', content: '<div class="callout">✨ <strong>Deine Mini-Übung für heute:</strong><br>Eine konkrete Handlungsempfehlung...</div>' }
        ]
    },
    {
        id: 'story',
        name: 'Persönliche Geschichte',
        icon: '📖',
        description: 'Storytelling Format',
        blocks: [
            { type: 'text', content: '<p><em>Es war an einem [Tag/Moment], als ich plötzlich...</em></p>' },
            { type: 'heading', content: '<h2>Was passiert ist</h2>' },
            { type: 'text', content: '<p>Erzähle die Geschichte lebendig und authentisch...</p>' },
            { type: 'heading', content: '<h2>Was ich daraus gelernt habe</h2>' },
            { type: 'text', content: '<p>Teile deine Erkenntnisse und wie sie dein Leben verändert haben...</p>' },
            { type: 'heading', content: '<h2>Was das für dich bedeuten kann</h2>' },
            { type: 'text', content: '<p>Verbinde deine Geschichte mit dem Leben deiner Leser:innen...</p>' }
        ]
    }
];

// Editor State (globaler Zustand)
let state = {
    posts: [],
    drafts: [],
    queue: [],
    currentPost: null,
    hasUnsavedChanges: false,
    publishingQueue: [],
    token: null,
    selectedTab: 'drafts',
    currentTab: 'drafts',
    selectedCategories: [],
    selectedImage: null,
    featuredImage: null,
    searchQuery: '', // Für Sidebar-Suche
    versions: {} // Versionsverlauf: { postId: [{ timestamp, content, blocks, title }] }
};

// Versionsverlauf Konfiguration
const VERSION_CONFIG = {
    maxVersionsPerPost: 20, // Maximale Anzahl Versionen pro Post
    storageKey: 'blog_versions'
};

// AI State
let aiState = {
    groqKey: null,
    isRecording: false,
    recognition: null,
    currentTranscript: '',
    lastAISuggestion: '',
    youtubeVideos: []
};

console.log('✓ blog-editor-config.js geladen');
