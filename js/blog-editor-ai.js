/* blog-editor-ai.js
 * AI Assistant: Groq API, Voice Input, Smart Formatting, YouTube Ideas
 * Zeilen: ~350 | Verantwortung: All AI Features
 * Abhängigkeiten: blog-editor-config.js, blog-editor-utils.js
 */

// ============================================
// GROQ API WRAPPER
// ============================================
const groqAPI = {
    async call(systemPrompt, userContent, model = 'llama-3.1-8b-instant') {
        if (!aiState.groqKey) {
            openAISetup();
            throw new Error('Groq API Key nicht konfiguriert');
        }

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${aiState.groqKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userContent }
                    ],
                    temperature: 0.7,
                    max_tokens: 2048
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'API Fehler');
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (e) {
            console.error('Groq API Error:', e);
            throw e;
        }
    }
};

// ============================================
// AI PANEL & SETUP
// ============================================
function toggleAIPanel() {
    const panel = document.getElementById('aiPanel');
    panel.classList.toggle('open');

    if (!aiState.groqKey && panel.classList.contains('open')) {
        const savedKey = localStorage.getItem('groq_api_key');
        if (savedKey) aiState.groqKey = savedKey;
    }
}

function openAISetup() {
    document.getElementById('aiSetupModal').classList.add('open');
}

function closeAISetup() {
    document.getElementById('aiSetupModal').classList.remove('open');
}

function saveGroqKey() {
    const key = document.getElementById('groqKeyInput').value.trim();
    if (!key || !key.startsWith('gsk_')) {
        toast('Bitte einen gültigen Groq API Key eingeben (beginnt mit gsk_)', 'error');
        return;
    }

    aiState.groqKey = key;
    localStorage.setItem('groq_api_key', key);
    closeAISetup();
    toast('KI-Assistent aktiviert!', 'success');
}

function initAI() {
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) aiState.groqKey = savedKey;
    initVoiceRecognition();
}

// ============================================
// VOICE INPUT (Web Speech API)
// ============================================
function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        aiState.recognition = new SpeechRecognition();
        aiState.recognition.continuous = true;
        aiState.recognition.interimResults = true;
        aiState.recognition.lang = 'de-DE';

        aiState.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            aiState.currentTranscript += finalTranscript;

            const transcriptEl = document.getElementById('voiceTranscript');
            transcriptEl.innerHTML = aiState.currentTranscript +
                (interimTranscript ? `<span style="color: #999;">${interimTranscript}</span>` : '');
            transcriptEl.style.display = 'block';
            document.getElementById('insertVoiceBtn').style.display = 'block';
        };

        aiState.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopVoiceInput();
            toast('Spracherkennung fehlgeschlagen: ' + event.error, 'error');
        };

        aiState.recognition.onend = () => {
            if (aiState.isRecording) aiState.recognition.start();
        };
    }
}

function toggleVoiceInput() {
    if (!aiState.recognition) {
        toast('Spracherkennung wird von diesem Browser nicht unterstützt', 'error');
        return;
    }
    aiState.isRecording ? stopVoiceInput() : startVoiceInput();
}

function startVoiceInput() {
    aiState.isRecording = true;
    aiState.currentTranscript = '';
    aiState.recognition.start();

    document.getElementById('voiceBtn').classList.add('recording');
    document.getElementById('voiceToolbarBtn')?.classList.add('active');
    document.getElementById('voiceStatus').textContent = '🔴 Aufnahme läuft... Klicke zum Stoppen';
    document.getElementById('voiceTranscript').innerHTML = '';
    document.getElementById('voiceTranscript').style.display = 'block';
}

function stopVoiceInput() {
    aiState.isRecording = false;
    aiState.recognition?.stop();

    document.getElementById('voiceBtn').classList.remove('recording');
    document.getElementById('voiceToolbarBtn')?.classList.remove('active');
    document.getElementById('voiceStatus').textContent = 'Klicke zum Sprechen';
}

function insertVoiceText() {
    if (aiState.currentTranscript.trim()) {
        const editor = document.getElementById('postContent');
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
            document.execCommand('insertText', false, aiState.currentTranscript);
        } else {
            editor.innerHTML += `<p>${escapeHtml(aiState.currentTranscript)}</p>`;
        }

        aiState.currentTranscript = '';
        document.getElementById('voiceTranscript').innerHTML = '';
        document.getElementById('voiceTranscript').style.display = 'none';
        document.getElementById('insertVoiceBtn').style.display = 'none';

        onContentChange();
        toast('Text eingefügt!', 'success');
    }
}

// ============================================
// AI WRITING ASSISTANCE
// ============================================
function getSelectedOrAllText() {
    const selection = window.getSelection();
    const editor = document.getElementById('postContent');
    if (selection.toString().trim().length > 10) {
        return { text: selection.toString(), isSelection: true };
    }
    return { text: editor.innerText, isSelection: false };
}

function setButtonLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.disabled = loading;
        btn.classList.toggle('loading', loading);
    }
}

async function aiImproveGrammar() {
    const { text, isSelection } = getSelectedOrAllText();
    if (text.length < 20) { toast('Bitte mehr Text schreiben oder auswählen', 'warning'); return; }

    setButtonLoading('btnGrammar', true);
    try {
        const result = await groqAPI.call(
            `Du bist ein einfühlsamer deutscher Lektor für Coaching-Texte. Verbessere Grammatik, Rechtschreibung und Stil, aber behalte die warmherzige, persönliche Stimme bei. Gib NUR den verbesserten Text zurück.`,
            text
        );
        aiState.lastAISuggestion = result;
        showAIResult('aiWritingResult', result, isSelection);
    } catch (e) { toast('Fehler: ' + e.message, 'error'); }
    finally { setButtonLoading('btnGrammar', false); }
}

async function aiChangeTone(tone) {
    const { text, isSelection } = getSelectedOrAllText();
    if (text.length < 20) { toast('Bitte mehr Text schreiben oder auswählen', 'warning'); return; }

    setButtonLoading('btnTone', true);
    try {
        const result = await groqAPI.call(
            `Du bist eine erfahrene Coaching-Texterin. Schreibe den Text in einem ${tone}en, einladenden Ton um. Der Text soll sich wie eine persönliche Nachricht anfühlen. Gib NUR den umgeschriebenen Text zurück.`,
            text
        );
        aiState.lastAISuggestion = result;
        showAIResult('aiWritingResult', result, isSelection);
    } catch (e) { toast('Fehler: ' + e.message, 'error'); }
    finally { setButtonLoading('btnTone', false); }
}

async function aiShortenText() {
    const { text, isSelection } = getSelectedOrAllText();
    if (text.length < 50) { toast('Text ist bereits kurz genug', 'warning'); return; }

    setButtonLoading('btnShorten', true);
    try {
        const result = await groqAPI.call(
            `Kürze den folgenden Text auf etwa die Hälfte. Behalte die wichtigsten Aussagen und emotionale Tiefe bei. Gib NUR den gekürzten Text zurück.`,
            text
        );
        aiState.lastAISuggestion = result;
        showAIResult('aiWritingResult', result, isSelection);
    } catch (e) { toast('Fehler: ' + e.message, 'error'); }
    finally { setButtonLoading('btnShorten', false); }
}

async function aiExpandText() {
    const { text, isSelection } = getSelectedOrAllText();
    if (text.length < 10) { toast('Bitte etwas Text schreiben zum Erweitern', 'warning'); return; }

    setButtonLoading('btnExpand', true);
    try {
        const result = await groqAPI.call(
            `Erweitere den Text mit mehr emotionaler Tiefe und Beispielen. Füge reflektierende Fragen hinzu. Der Ton soll warmherzig sein. Gib NUR den erweiterten Text zurück.`,
            text
        );
        aiState.lastAISuggestion = result;
        showAIResult('aiWritingResult', result, isSelection);
    } catch (e) { toast('Fehler: ' + e.message, 'error'); }
    finally { setButtonLoading('btnExpand', false); }
}

async function aiImproveText() {
    const selection = window.getSelection();
    if (selection.toString().trim().length < 10) {
        toast('Bitte Text auswählen zum Verbessern', 'warning');
        return;
    }
    toggleAIPanel();
    await aiImproveGrammar();
}

function showAIResult(elementId, text, canApply = true) {
    const el = document.getElementById(elementId);
    el.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
    el.style.display = 'block';
    if (canApply && elementId === 'aiWritingResult') {
        document.getElementById('applyAIBtn').style.display = 'block';
    }
}

function applyAISuggestion() {
    if (!aiState.lastAISuggestion) return;

    const selection = window.getSelection();
    const editor = document.getElementById('postContent');

    if (selection.toString().trim().length > 10 && editor.contains(selection.anchorNode)) {
        document.execCommand('insertText', false, aiState.lastAISuggestion);
    } else {
        editor.innerHTML = aiState.lastAISuggestion.split('\n').map(p => `<p>${escapeHtml(p)}</p>`).join('');
    }

    document.getElementById('aiWritingResult').style.display = 'none';
    document.getElementById('applyAIBtn').style.display = 'none';
    aiState.lastAISuggestion = '';
    onContentChange();
    toast('Änderung übernommen!', 'success');
}

// ============================================
// AUTO-CATEGORIZATION
// ============================================
async function aiCategorize() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').innerText;

    if (content.length < 50) { toast('Bitte mehr Inhalt schreiben für Kategorisierung', 'warning'); return; }

    setButtonLoading('btnCategorize', true);
    try {
        const result = await groqAPI.call(
            `Du analysierst Blog-Artikel. Verfügbare Kategorien: achtsamkeit, selbstliebe, beziehung, heldinnenreise, hochbegabung, koerper. Gib 1-3 passende Kategorien als kommaseparierte Liste zurück. NUR die IDs.`,
            `Titel: ${title}\n\nInhalt: ${content.substring(0, 2000)}`
        );

        const categories = result.toLowerCase().split(',').map(c => c.trim()).filter(c => BLOG_CATEGORIES[c]);
        const container = document.getElementById('aiCategories');
        container.innerHTML = categories.map(cat => `
            <span class="ai-category-tag suggested" onclick="selectAICategory('${cat}')">${BLOG_CATEGORIES[cat]}</span>
        `).join('');

        toast(`${categories.length} Kategorien vorgeschlagen`, 'success');
    } catch (e) { toast('Fehler: ' + e.message, 'error'); }
    finally { setButtonLoading('btnCategorize', false); }
}

function selectAICategory(categoryId) {
    const tag = document.querySelector(`[data-cat="${categoryId}"]`);
    if (tag && !tag.classList.contains('active')) tag.click();
    toast(`Kategorie "${BLOG_CATEGORIES[categoryId]}" hinzugefügt`, 'success');
}

// ============================================
// CONTENT GENERATION
// ============================================
async function aiGenerateSummary() {
    const content = document.getElementById('postContent').innerText;
    if (content.length < 100) { toast('Bitte mehr Inhalt schreiben', 'warning'); return; }

    setButtonLoading('btnSummary', true);
    try {
        const result = await groqAPI.call(
            `Erstelle eine 2-3 Satz Zusammenfassung, die die Kernbotschaft einfängt und neugierig macht. Warmherziger Ton. NUR die Zusammenfassung.`,
            content.substring(0, 3000)
        );
        showAIResult('aiContentResult', result, false);
        if (confirm('Zusammenfassung als Kurzbeschreibung verwenden?')) {
            document.getElementById('postExcerpt').value = result;
            onContentChange();
        }
    } catch (e) { toast('Fehler: ' + e.message, 'error'); }
    finally { setButtonLoading('btnSummary', false); }
}

async function aiGenerateTitle() {
    const content = document.getElementById('postContent').innerText;
    if (content.length < 100) { toast('Bitte mehr Inhalt schreiben', 'warning'); return; }

    setButtonLoading('btnTitle', true);
    try {
        const result = await groqAPI.call(
            `Erstelle 3 einladende Blog-Titel (max 60 Zeichen), die emotional ansprechen und neugierig machen. Format: Nummerierte Liste.`,
            content.substring(0, 2000)
        );
        showAIResult('aiContentResult', result, false);
    } catch (e) { toast('Fehler: ' + e.message, 'error'); }
    finally { setButtonLoading('btnTitle', false); }
}

async function aiGenerateMetaDescription() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').innerText;
    if (content.length < 100) { toast('Bitte mehr Inhalt schreiben', 'warning'); return; }

    setButtonLoading('btnMeta', true);
    try {
        const result = await groqAPI.call(
            `Erstelle eine SEO-Meta-Beschreibung (max 155 Zeichen), die zusammenfasst und zum Klicken einlädt. NUR die Meta-Beschreibung.`,
            `Titel: ${title}\n\nInhalt: ${content.substring(0, 1500)}`
        );
        document.getElementById('metaDescription').value = result.substring(0, 160);
        updateCharCount('metaDescription', 'metaDescCount', 160);
        onContentChange();
        toast('Meta-Beschreibung erstellt!', 'success');
    } catch (e) { toast('Fehler: ' + e.message, 'error'); }
    finally { setButtonLoading('btnMeta', false); }
}

async function aiGenerateOutline() {
    const title = document.getElementById('postTitle').value || 'Neuer Artikel';

    setButtonLoading('btnOutline', true);
    try {
        const result = await groqAPI.call(
            `Erstelle eine Blog-Gliederung mit 4-6 Abschnitten. Format: ## [Überschrift] gefolgt von kurzer Beschreibung. Warmherziger Ton.`,
            `Thema: ${title}`
        );
        showAIResult('aiContentResult', result, false);
        if (confirm('Gliederung in den Editor einfügen?')) {
            const editor = document.getElementById('postContent');
            const html = result.split('\n').map(line =>
                line.startsWith('## ') ? `<h2>${escapeHtml(line.substring(3))}</h2>` : `<p>${escapeHtml(line)}</p>`
            ).join('');
            editor.innerHTML = html;
            onContentChange();
        }
    } catch (e) { toast('Fehler: ' + e.message, 'error'); }
    finally { setButtonLoading('btnOutline', false); }
}

// ============================================
// YOUTUBE TOPIC IDEAS
// ============================================
async function loadYouTubeIdeas() {
    setButtonLoading('btnYouTube', true);
    try {
        const response = await fetch('data/video-categories.json');
        const videos = await response.json();

        const videoList = Object.entries(videos)
            .sort((a, b) => new Date(b[1].categorized_at) - new Date(a[1].categorized_at))
            .slice(0, 10);

        aiState.youtubeVideos = videoList;
        const videoTitles = videoList.map(([id, v]) => v.title).join('\n');

        const result = await groqAPI.call(
            `Du bist Content-Stratege. Erstelle 3 Blog-Post-Ideen basierend auf diesen Video-Titeln. JSON Array: [{"title": "...", "description": "...", "basedOn": "Video-Titel"}]`,
            videoTitles,
            'llama-3.1-70b-versatile'
        );

        try {
            const ideas = JSON.parse(result);
            const container = document.getElementById('youtubeIdeas');
            container.innerHTML = ideas.map(idea => `
                <div class="youtube-idea" onclick="useYouTubeIdea('${escapeHtml(idea.title)}')">
                    <div class="youtube-idea-title">📝 ${escapeHtml(idea.title)}</div>
                    <div class="youtube-idea-desc">${escapeHtml(idea.description)}<br><small style="color: #ff0000;">🎬 Basiert auf: ${escapeHtml(idea.basedOn)}</small></div>
                </div>
            `).join('');
        } catch (e) {
            document.getElementById('youtubeIdeas').innerHTML = `<div class="ai-result">${escapeHtml(result)}</div>`;
        }

        toast('Themenvorschläge geladen!', 'success');
    } catch (e) { toast('Fehler beim Laden: ' + e.message, 'error'); }
    finally { setButtonLoading('btnYouTube', false); }
}

function useYouTubeIdea(title) {
    document.getElementById('postTitle').value = title;
    onContentChange();
    toast('Titel übernommen!', 'success');
}

// ============================================
// SMART FORMATTING
// ============================================
function insertHighlightBox() {
    const html = `<div style="background: linear-gradient(135deg, #f5f0ff 0%, #fff5f5 100%); border-left: 4px solid #667eea; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;"><p style="font-weight: 600; color: #667eea; margin-bottom: 0.5rem;">💡 Wichtiger Gedanke</p><p>Hier deinen hervorgehobenen Gedanken einfügen...</p></div>`;
    execCmd('insertHTML', html);
    toast('Highlight-Box eingefügt', 'success');
}

function insertCallout() {
    const html = `<div style="background: #fff8e1; border: 1px solid #ffe082; padding: 1.25rem; border-radius: 8px; margin: 1.5rem 0; display: flex; gap: 1rem; align-items: flex-start;"><span style="font-size: 1.5rem;">📌</span><div><p style="font-weight: 600; margin-bottom: 0.25rem;">Merke dir</p><p style="margin: 0;">Hier eine wichtige Erkenntnis einfügen...</p></div></div>`;
    execCmd('insertHTML', html);
    toast('Callout eingefügt', 'success');
}

function insertBlockquote() {
    const html = `<blockquote style="border-left: 4px solid #D4A574; padding: 1.5rem 2rem; margin: 2rem 0; background: #faf8f5; border-radius: 0 8px 8px 0; font-style: italic; font-size: 1.15rem;"><p>"Das Leben ist zu kurz für später."</p><footer style="margin-top: 0.75rem; font-size: 0.9rem; font-style: normal; color: #666;">— Unbekannt</footer></blockquote>`;
    execCmd('insertHTML', html);
    toast('Zitat eingefügt', 'success');
}

async function aiFormatForReadability() {
    const content = document.getElementById('postContent').innerHTML;
    if (content.length < 200) { toast('Bitte mehr Inhalt schreiben', 'warning'); return; }

    setButtonLoading('btnReadability', true);
    try {
        const textContent = document.getElementById('postContent').innerText;
        const result = await groqAPI.call(
            `Formatiere den Text für bessere Lesbarkeit: kürzere Absätze, Zwischenüberschriften (##), **fett** für Wichtiges, Listen wo passend. HTML mit <h2>, <p>, <strong>, <ul>/<li>.`,
            textContent.substring(0, 4000)
        );

        if (confirm('Formatierung anwenden?')) {
            document.getElementById('postContent').innerHTML = sanitizeHTML(result);
            onContentChange();
            toast('Formatierung angewendet!', 'success');
        }
    } catch (e) { toast('Fehler: ' + e.message, 'error'); }
    finally { setButtonLoading('btnReadability', false); }
}
