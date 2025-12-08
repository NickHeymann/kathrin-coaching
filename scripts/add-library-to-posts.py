#!/usr/bin/env python3
"""
Fügt die Bibliothek/Bookmark-Funktionalität zu allen Blog-Posts hinzu.
"""

import os
import re

# Alle Blog-Posts (NEUE KURZE URLs - aktualisiert nach URL-Refactoring)
BLOG_POSTS = [
    # Achtsamkeit
    "angst-und-achtsamkeit.html",
    "achtsamkeit-sinne.html",
    "sonnenuntergang-grignan.html",
    "stille-heilung.html",
    "qarrtsiluni.html",
    "freude-wegweiser.html",
    # Selbstliebe
    "dankbarkeit.html",
    "einzigartigkeit.html",
    "fehler-selbstwert.html",
    "verlass-dich-nicht.html",
    "wer-bist-du.html",
    "grenzen-setzen.html",
    "es-ist-okay.html",
    "selbstvergessen.html",
    # Beziehung
    "beziehungsprobleme.html",
    "ehe-retten.html",
    "gehen-oder-bleiben.html",
    "love-letters.html",
    "gemeinsam-jammern.html",
    # Heldinnenreise
    "heldinnenreise.html",
    "herzenswunsch.html",
    "leben-planen.html",
    "komfortzone.html",
    "freiheit.html",
    "was-ist-wichtig.html",
    "erfuelltes-leben.html",
    "ganz-sein.html",
    "wunschlos-gluecklich.html",
    "innerer-frieden.html",
    "vision-board.html",
    "suedfrankreich.html",
    "letzte-male.html",
    # Hochbegabung
    "hochbegabt.html",
    "hochbegabung-hochsensibel.html",
    # Körper & Heilung
    "geschenk-wut.html",
    "angst-vor-power.html",
    "gedankenkarussell.html",
    "hilfe-annehmen.html",
    "glaubenssaetze-pferde.html",
    "innere-fuehrung.html",
    "kloss-im-hals.html",
    "nackenschmerzen.html",
    "wen-ziehst-du.html",
    "gefuehle-achtsam.html",
    "liebe-der-pferde.html",
    "pferde-heilen.html",
]

# CSS für Bookmark-Button (wird zum Style-Block hinzugefügt)
BOOKMARK_CSS = """
        .bookmark-floating{position:fixed;bottom:100px;right:30px;z-index:999;display:flex;flex-direction:column;gap:10px}
        .bookmark-btn-float{width:50px;height:50px;background:white;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(0,0,0,.2);transition:transform .2s,box-shadow .2s}
        .bookmark-btn-float:hover{transform:scale(1.1);box-shadow:0 6px 20px rgba(0,0,0,.25)}
        .bookmark-btn-float svg{width:24px;height:24px;color:var(--color-text-light);transition:color .2s}
        .bookmark-btn-float.saved svg{color:var(--color-accent);fill:var(--color-accent)}
        .library-btn-float{width:50px;height:50px;background:var(--color-accent);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(0,0,0,.2);transition:transform .2s;text-decoration:none}
        .library-btn-float:hover{transform:scale(1.1)}
        .library-btn-float svg{width:24px;height:24px;color:white}
        .library-count-float{position:absolute;top:-5px;right:-5px;background:var(--color-primary);color:white;font-size:.7rem;padding:2px 6px;border-radius:10px;font-weight:600}"""

# HTML für Floating-Buttons (vor </body>)
def get_floating_html(filename):
    return f'''
    <div class="bookmark-floating">
        <button class="bookmark-btn-float" id="bookmarkBtn" title="Artikel merken">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        </button>
        <a href="blog.html" class="library-btn-float" title="Zur Bibliothek">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span class="library-count-float" id="libraryCount">0</span>
        </a>
    </div>

    <script>
        const STORAGE_KEY = 'kathrin-blog-library';
        const CURRENT_SLUG = '{filename}';

        function getLibrary() {{
            try {{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }}
            catch (e) {{ return []; }}
        }}

        function saveLibrary(library) {{
            localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
        }}

        function updateUI() {{
            const library = getLibrary();
            const btn = document.getElementById('bookmarkBtn');
            const count = document.getElementById('libraryCount');

            btn.classList.toggle('saved', library.includes(CURRENT_SLUG));
            count.textContent = library.length;
        }}

        document.getElementById('bookmarkBtn').addEventListener('click', function() {{
            const library = getLibrary();
            const index = library.indexOf(CURRENT_SLUG);
            if (index > -1) {{
                library.splice(index, 1);
            }} else {{
                library.push(CURRENT_SLUG);
            }}
            saveLibrary(library);
            updateUI();
        }});

        updateUI();
    </script>
'''

def add_library_to_post(filepath):
    """Fügt die Bibliothek-Funktionalität zu einem Blog-Post hinzu."""
    filename = os.path.basename(filepath)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Prüfen ob bereits vorhanden
    if 'bookmark-floating' in content:
        return False, "Bereits vorhanden"

    # CSS hinzufügen (vor </style>)
    if '</style>' in content:
        content = content.replace('</style>', BOOKMARK_CSS + '\n    </style>')

    # Floating-Buttons hinzufügen (vor </body>)
    if '</body>' in content:
        content = content.replace('</body>', get_floating_html(filename) + '</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return True, "Erfolgreich"

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)

    print("Bibliothek-Funktionalität hinzufügen")
    print("=" * 50)

    success_count = 0
    skip_count = 0

    for filename in BLOG_POSTS:
        filepath = os.path.join(project_dir, filename)

        if not os.path.exists(filepath):
            print(f"{filename}: Nicht gefunden")
            continue

        success, message = add_library_to_post(filepath)

        if success:
            print(f"{filename}: ✓ {message}")
            success_count += 1
        else:
            print(f"{filename}: ⏭ {message}")
            skip_count += 1

    print("=" * 50)
    print(f"Ergebnis: {success_count} aktualisiert, {skip_count} übersprungen")

if __name__ == "__main__":
    main()
