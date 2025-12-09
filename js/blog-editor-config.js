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

// Editor State (globaler Zustand)
let state = {
    posts: [],
    drafts: [],
    currentPost: null,
    hasUnsavedChanges: false,
    publishingQueue: [],
    githubToken: null,
    selectedTab: 'posts'
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
