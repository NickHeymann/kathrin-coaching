#!/usr/bin/env python3
"""
Fügt Blog-Enhancements CSS und JS zu allen Blog-Post HTML-Dateien hinzu.
"""

import os
import re
from pathlib import Path

# Blog-Post Dateien (basierend auf blogDatabase)
BLOG_POSTS = [
    'angst-achtsamkeit-und-frieden.html',
    'achtsamkeit-sinne.html',
    'sonnenuntergang-grignan.html',
    'stille-heilung.html',
    'qarrtsiluni.html',
    'freude-wegweiser.html',
    'dankbarkeit.html',
    'einzigartigkeit.html',
    'fehler-selbstwert.html',
    'verlass-dich-nicht.html',
    'es-ist-okay.html',
    'selbstvergessen.html',
    'grenzen-setzen.html',
    'wer-bist-du.html',
    'beziehungsprobleme.html',
    'ehe-retten.html',
    'gehen-oder-bleiben.html',
    'love-letters.html',
    'gemeinsam-jammern.html',
    'heldinnenreise.html',
    'herzenswunsch.html',
    'leben-planen.html',
    'komfortzone.html',
    'freiheit.html',
    'was-ist-wichtig.html',
    'erfuelltes-leben.html',
    'ganz-sein.html',
    'wunschlos-gluecklich.html',
    'innerer-frieden.html',
    'vision-board.html',
    'letzte-male.html',
    'hochbegabung-hochsensibel.html',
    'geschenk-wut.html',
    'angst-vor-power.html',
    'gedankenkarussell.html',
    'glaubenssaetze-pferde.html',
    'innere-fuehrung.html',
    'gefuehle-achtsam.html',
    'klossgefuehl-im-hals-wie-eine-aufstellung-hilft.html',
    'nackenschmerzen.html',
    'wen-ziehst-du.html',
    'die-liebe-der-pferde.html',
    'pferde-heilen.html',
    'hilfe-annehmen.html',
]

CSS_LINK = '<!-- Blog Enhancements -->\n<link href="css/blog-enhancements.css" rel="stylesheet"/>'
JS_LINK = '<!-- Blog Enhancements JS -->\n<script src="js/blog-enhancements.js"></script>'

def update_blog_post(filepath):
    """Fügt CSS und JS zu einer Blog-Post Datei hinzu."""
    if not os.path.exists(filepath):
        print(f"SKIP: {filepath} existiert nicht")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # CSS hinzufügen (nach dem letzten link vor <style>)
    if 'blog-enhancements.css' not in content:
        # Finde die Position vor <style>
        pattern = r'(<link[^>]*display=swap[^>]*/>)\s*(<style>)'
        match = re.search(pattern, content)
        if match:
            content = content.replace(
                match.group(0),
                f'{match.group(1)}\n{CSS_LINK}\n{match.group(2)}'
            )
            modified = True
            print(f"CSS hinzugefügt: {filepath}")

    # JS hinzufügen (vor dem ersten <script> Tag)
    if 'blog-enhancements.js' not in content:
        # Finde die Position vor dem ersten script
        pattern = r'(</div>\s*)(<!--.*?-->\s*)?(<script>)'
        match = re.search(pattern, content)
        if match:
            prefix = match.group(2) if match.group(2) else ''
            content = content.replace(
                match.group(0),
                f'{match.group(1)}{JS_LINK}\n{prefix}{match.group(3)}'
            )
            modified = True
            print(f"JS hinzugefügt: {filepath}")

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    else:
        print(f"BEREITS VORHANDEN: {filepath}")
        return False

def main():
    base_path = Path(__file__).parent.parent
    updated = 0

    for post in BLOG_POSTS:
        filepath = base_path / post
        if update_blog_post(str(filepath)):
            updated += 1

    print(f"\n{updated} Dateien aktualisiert")

if __name__ == '__main__':
    main()
