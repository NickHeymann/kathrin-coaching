#!/usr/bin/env python3
"""
Entfernt inline CSS aus cms-editor.html und ersetzt es durch externe CSS-Links.
"""

import re

# Datei einlesen
with open('/Users/nickheymann/Desktop/kathrin-coaching-github/cms-editor.html', 'r', encoding='utf-8') as f:
    content = f.read()

# CSS Links die eingefügt werden sollen
css_links = '''<link href="css/cms-editor-base.css" rel="stylesheet"/>
<link href="css/cms-editor-layout.css" rel="stylesheet"/>
<link href="css/cms-editor-panels.css" rel="stylesheet"/>
<link href="css/cms-editor-tools.css" rel="stylesheet"/>
<link href="css/cms-editor-responsive.css" rel="stylesheet"/>'''

# Erstes <style> Tag finden und ersetzen (Zeilen 20-934)
# Pattern für das erste style-Tag
first_style_pattern = r'<style>\s*\* \{ margin: 0;.*?</style>'
content = re.sub(first_style_pattern, css_links, content, count=1, flags=re.DOTALL)

# Zweites <style> Tag finden und entfernen (Zeilen 1149-1387)
# Pattern für das zweite style-Tag (enthält .floating-toolbar)
second_style_pattern = r'<style>\s*/\* Schwebende Toolbar \*/.*?</style>'
content = re.sub(second_style_pattern, '', content, count=1, flags=re.DOTALL)

# Datei speichern
with open('/Users/nickheymann/Desktop/kathrin-coaching-github/cms-editor.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("cms-editor.html wurde erfolgreich modularisiert!")
print(f"Neue Dateigröße: {len(content)} Zeichen")
