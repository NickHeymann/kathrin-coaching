/**
 * Website Editor Configuration
 * Zentrale Konfiguration mit URL-Parameter-Unterstützung
 * @module config
 */

const urlParams = new URLSearchParams(window.location.search);

export const CONFIG = Object.freeze({
    owner: urlParams.get('owner') || 'NickHeymann',
    repo: urlParams.get('repo') || 'kathrin-coaching',
    // sourceBranch: Laden von (Live-Website)
    sourceBranch: urlParams.get('source') || 'main',
    // branch: Speichern nach (Bearbeitungs-Branch)
    branch: urlParams.get('branch') || 'kathrin-edits',
    mainBranch: urlParams.get('main') || 'main',
    autosaveInterval: parseInt(urlParams.get('autosave')) || 30000,
    apiRateLimit: 30,
    apiRateLimitWindow: 60000,
    localBackupInterval: 10000
});

export const EMOJIS = Object.freeze([
    '😀','😃','😄','😁','😅','😂','🤣','😊','😇','🥰','😍','🤩','😘','😗','😚','😋','😛','😜','🤪','😝',
    '🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴',
    '😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️',
    '😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱',
    '😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','💪','👍','👎','👏',
    '🙌','🤝','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️','💕','💞','💓','💗','💖','💘','💝','⭐',
    '🌟','✨','💫','🔥','💯','✅','❌','⚠️','📌','📍','🎯','💡','📝','✏️','📎','🔗','💬','💭','🗯️'
]);
