#!/usr/bin/env python3
"""
HTML Optimization & WordPress Legacy Cleanup
Bereinigt alle HTML-Dateien von WordPress-Code und optimiert für Performance
"""

import re
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment
from typing import Dict, List, Set, Tuple
import json
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

class HTMLAnalyzer:
    """Analysiert HTML-Dateien auf Legacy-Code und Probleme"""

    def __init__(self):
        self.issues = defaultdict(lambda: defaultdict(int))

    def analyze_file(self, file_path: Path) -> Dict:
        """Analysiert eine einzelne HTML-Datei"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')

        issues = {
            'empty_spans': 0,
            'empty_divs': 0,
            'inline_styles': 0,
            'wordpress_classes': 0,
            'data_attributes': 0,
            'deprecated_tags': 0,
            'i_tags': 0,
            'b_tags': 0,
            'br_chains': 0,
            'nested_spans': 0,
            'non_semantic_wrappers': 0,
        }

        # Leere spans/divs
        for tag_name in ['span', 'div']:
            for tag in soup.find_all(tag_name):
                text = tag.get_text(strip=True)
                if not text and not tag.find_all(['img', 'svg', 'iframe']):
                    issues[f'empty_{tag_name}s'] += 1

        # Inline styles
        for tag in soup.find_all(style=True):
            issues['inline_styles'] += 1

        # WordPress-spezifische Klassen
        wp_patterns = [
            'wp-', 'elementor-', 'post-', 'page-', 'attachment-',
            'category-', 'tag-', 'type-', 'status-', 'hentry'
        ]
        for tag in soup.find_all(class_=True):
            classes = tag.get('class', [])
            for cls in classes:
                if any(cls.startswith(pattern) for pattern in wp_patterns):
                    issues['wordpress_classes'] += 1
                    break

        # data-* Attribute (WordPress/Elementor)
        for tag in soup.find_all():
            for attr in tag.attrs:
                if attr.startswith('data-'):
                    issues['data_attributes'] += 1
                    break

        # Deprecated/non-semantic tags
        deprecated = soup.find_all(['i', 'b', 'font', 'center'])
        issues['i_tags'] = len(soup.find_all('i'))
        issues['b_tags'] = len(soup.find_all('b'))
        issues['deprecated_tags'] = len([t for t in deprecated if t.name in ['font', 'center']])

        # BR-Ketten (mehr als 2 aufeinanderfolgende <br>)
        br_chains = re.findall(r'(<br\s*/?>\s*){3,}', content)
        issues['br_chains'] = len(br_chains)

        # Verschachtelte spans (span > span)
        for span in soup.find_all('span'):
            if span.find_parent('span'):
                issues['nested_spans'] += 1

        return issues

    def analyze_all(self, html_files: List[Path]) -> Dict:
        """Analysiert alle HTML-Dateien parallel"""
        total_issues = defaultdict(int)
        file_issues = {}

        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_file = {
                executor.submit(self.analyze_file, f): f
                for f in html_files
            }

            for future in as_completed(future_to_file):
                file_path = future_to_file[future]
                try:
                    issues = future.result()
                    file_issues[str(file_path)] = issues

                    # Akkumuliere Gesamt-Issues
                    for key, count in issues.items():
                        total_issues[key] += count

                except Exception as e:
                    print(f"   ⚠️  Fehler bei {file_path.name}: {e}")

        return {
            'total': dict(total_issues),
            'by_file': file_issues
        }


class WordPressLegacyCleaner:
    """Entfernt WordPress-Legacy-Code"""

    # WordPress/Elementor-spezifische Klassen
    WP_CLASS_PATTERNS = [
        'wp-', 'elementor-', 'post-', 'page-', 'attachment-',
        'category-', 'tag-', 'type-', 'status-', 'hentry',
        'entry-', 'site-', 'widget-', 'sidebar-'
    ]

    # data-* Attribute die entfernt werden sollen
    WP_DATA_ATTRS = [
        'data-elementor-', 'data-id', 'data-element_type',
        'data-widget_type', 'data-settings', 'data-post-id'
    ]

    def clean(self, soup: BeautifulSoup) -> BeautifulSoup:
        """Entfernt WordPress Legacy Code"""

        # 1. Entferne leere spans/divs
        self._remove_empty_tags(soup, ['span', 'div'])

        # 2. Entferne WordPress-Klassen
        self._remove_wp_classes(soup)

        # 3. Entferne WordPress data-* Attribute
        self._remove_wp_data_attrs(soup)

        # 4. Entferne WordPress-Kommentare
        self._remove_wp_comments(soup)

        # 5. Bereinige verschachtelte spans
        self._unwrap_nested_spans(soup)

        # 6. Entferne leere Attribute
        self._remove_empty_attributes(soup)

        return soup

    def _remove_empty_tags(self, soup: BeautifulSoup, tag_names: List[str]):
        """Entfernt leere Tags ohne Inhalt"""
        for tag_name in tag_names:
            # Erstelle Kopie der Liste um Modification während Iteration zu vermeiden
            tags_to_process = soup.find_all(tag_name)[:]

            for tag in tags_to_process:
                # Prüfe ob Tag noch im DOM ist
                if tag.parent is None:
                    continue

                # Prüfe ob Tag leer ist (kein Text, keine wichtigen Kinder)
                text = tag.get_text(strip=True)
                important_children = tag.find_all(['img', 'svg', 'iframe', 'video'])

                # Prüfe ob Tag nur whitespace enthält
                if not text and not important_children:
                    # Erhalte Klassen die wichtig sein könnten
                    classes = tag.get('class', [])
                    important_classes = [
                        'container', 'back-to-top', 'separator', 'article-hero',
                        'author-bio', 'reading-time', 'external-icon'
                    ]

                    # Nicht löschen wenn wichtige Klasse
                    has_important_class = any(
                        any(ic in c for ic in important_classes)
                        for c in classes
                    )

                    if not has_important_class:
                        tag.unwrap() if tag.string else tag.decompose()

    def _remove_wp_classes(self, soup: BeautifulSoup):
        """Entfernt WordPress-spezifische Klassen"""
        for tag in soup.find_all(class_=True):
            classes = tag.get('class', [])
            new_classes = [
                cls for cls in classes
                if not any(cls.startswith(pattern) for pattern in self.WP_CLASS_PATTERNS)
            ]

            if new_classes:
                tag['class'] = new_classes
            else:
                del tag['class']

    def _remove_wp_data_attrs(self, soup: BeautifulSoup):
        """Entfernt WordPress data-* Attribute"""
        for tag in soup.find_all():
            attrs_to_remove = []
            for attr in tag.attrs:
                # Entferne WP-spezifische data attrs
                if attr.startswith('data-') and any(
                    attr.startswith(pattern) for pattern in self.WP_DATA_ATTRS
                ):
                    attrs_to_remove.append(attr)

            for attr in attrs_to_remove:
                del tag[attr]

    def _remove_wp_comments(self, soup: BeautifulSoup):
        """Entfernt WordPress HTML-Kommentare"""
        wp_comment_patterns = [
            'wp', 'elementor', 'plugin', 'theme', 'widget'
        ]

        for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
            comment_lower = comment.lower()
            if any(pattern in comment_lower for pattern in wp_comment_patterns):
                comment.extract()

    def _unwrap_nested_spans(self, soup: BeautifulSoup):
        """Entfernt unnötig verschachtelte spans"""
        changed = True
        while changed:
            changed = False
            for span in soup.find_all('span'):
                # Wenn span nur ein span-Kind hat und sonst nichts
                children = list(span.children)
                if len(children) == 1 and hasattr(children[0], 'name') and children[0].name == 'span':
                    # Merge attributes wenn nötig
                    child = children[0]

                    # Wenn parent keine wichtigen attrs hat, unwrap parent
                    if not span.get('class') and not span.get('id'):
                        span.unwrap()
                        changed = True
                    # Wenn child keine wichtigen attrs hat, unwrap child
                    elif not child.get('class') and not child.get('id'):
                        child.unwrap()
                        changed = True

    def _remove_empty_attributes(self, soup: BeautifulSoup):
        """Entfernt leere Attribute"""
        for tag in soup.find_all():
            attrs_to_remove = []
            for attr, value in tag.attrs.items():
                if not value or (isinstance(value, list) and not value):
                    attrs_to_remove.append(attr)

            for attr in attrs_to_remove:
                del tag[attr]


class SemanticHTMLOptimizer:
    """Konvertiert zu semantischem HTML5"""

    def optimize(self, soup: BeautifulSoup) -> BeautifulSoup:
        """Optimiert HTML für Semantik"""

        # 1. <i> → <em> (nur für emphasis, nicht Icons)
        self._convert_i_to_em(soup)

        # 2. <b> → <strong>
        self._convert_b_to_strong(soup)

        # 3. Entferne deprecated tags
        self._remove_deprecated_tags(soup)

        # 4. Bereinige BR-Ketten
        self._clean_br_chains(soup)

        # 5. Entferne inline styles (außer notwendige)
        self._remove_inline_styles(soup)

        return soup

    def _convert_i_to_em(self, soup: BeautifulSoup):
        """Konvertiert <i> zu <em> wenn es für emphasis verwendet wird"""
        # Erstelle Kopie um Modification während Iteration zu vermeiden
        for i_tag in soup.find_all('i')[:]:
            # Prüfe ob Tag noch im DOM ist
            if i_tag.parent is None:
                continue

            # Wenn <i> Text enthält und keine Icon-Klasse hat
            text = i_tag.get_text(strip=True)
            classes = i_tag.get('class', [])

            # Prüfe ob es ein Icon ist
            is_icon = any(
                icon_class in ' '.join(classes)
                for icon_class in ['icon', 'fa-', 'material-']
            )

            # Wenn es Text hat und kein Icon ist, konvertiere zu <em>
            if text and not is_icon:
                i_tag.name = 'em'
            # Wenn es ein Icon ist, behalte <i> (Browser-Konvention)
            # Wenn es leer ist, entferne es
            elif not text and not is_icon:
                i_tag.unwrap()

    def _convert_b_to_strong(self, soup: BeautifulSoup):
        """Konvertiert <b> zu <strong>"""
        for b_tag in soup.find_all('b'):
            b_tag.name = 'strong'

    def _remove_deprecated_tags(self, soup: BeautifulSoup):
        """Entfernt deprecated HTML-Tags"""
        deprecated_tags = ['font', 'center', 'big', 'small', 'strike']

        for tag_name in deprecated_tags:
            # Erstelle Kopie um Modification während Iteration zu vermeiden
            for tag in soup.find_all(tag_name)[:]:
                # Prüfe ob Tag noch im DOM ist
                if tag.parent is None:
                    continue
                # Unwrap (behält Inhalt, entfernt nur Tag)
                tag.unwrap()

    def _clean_br_chains(self, soup: BeautifulSoup):
        """Reduziert <br>-Ketten auf maximal 2"""
        for tag in soup.find_all():
            if tag.string:
                continue

            children = list(tag.children)
            new_children = []
            br_count = 0

            for child in children:
                if hasattr(child, 'name') and child.name == 'br':
                    br_count += 1
                    if br_count <= 2:
                        new_children.append(child)
                else:
                    br_count = 0
                    new_children.append(child)

            # Wenn Änderungen, ersetze children
            if len(new_children) < len(children):
                tag.clear()
                for child in new_children:
                    tag.append(child)

    def _remove_inline_styles(self, soup: BeautifulSoup):
        """Entfernt inline styles (mit Ausnahmen)"""
        # Behalte inline styles nur für spezielle Fälle
        keep_inline_for_tags = ['img', 'svg', 'table']

        for tag in soup.find_all(style=True):
            # Entferne style attribute außer für spezielle Tags
            if tag.name not in keep_inline_for_tags:
                del tag['style']


class PerformanceOptimizer:
    """Optimiert HTML für Performance"""

    def optimize(self, soup: BeautifulSoup, file_path: Path) -> BeautifulSoup:
        """Wendet Performance-Optimierungen an"""

        # 1. Lazy loading für Bilder (außer Hero)
        self._add_lazy_loading(soup, file_path)

        # 2. Preconnect für externe Ressourcen
        self._add_preconnects(soup)

        # 3. Async/defer für Scripts
        self._optimize_scripts(soup)

        # 4. Optimize meta tags
        self._optimize_meta_tags(soup)

        return soup

    def _add_lazy_loading(self, soup: BeautifulSoup, file_path: Path):
        """Fügt lazy loading zu Bildern hinzu"""
        images = soup.find_all('img')

        for i, img in enumerate(images):
            # Erste 2 Bilder nicht lazy loaden (Hero, Featured Image)
            if i < 2:
                # Füge fetchpriority="high" für Hero-Bild hinzu
                if i == 0:
                    img['fetchpriority'] = 'high'
                continue

            # Lazy loading für restliche Bilder
            if not img.get('loading'):
                img['loading'] = 'lazy'

            # Füge decoding="async" hinzu
            if not img.get('decoding'):
                img['decoding'] = 'async'

    def _add_preconnects(self, soup: BeautifulSoup):
        """Fügt preconnect für externe Ressourcen hinzu"""
        head = soup.find('head')
        if not head:
            return

        # Prüfe ob preconnects bereits existieren
        existing_preconnects = {
            link.get('href')
            for link in head.find_all('link', rel='preconnect')
        }

        # Nur hinzufügen wenn noch nicht vorhanden
        preconnects = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ]

        for url in preconnects:
            if url not in existing_preconnects:
                # Finde Position nach charset meta tag
                charset_meta = head.find('meta', charset=True)
                if charset_meta:
                    # Erstelle preconnect link
                    link = soup.new_tag('link', rel='preconnect', href=url)
                    if 'gstatic' in url:
                        link['crossorigin'] = ''
                    charset_meta.insert_after(link)

    def _optimize_scripts(self, soup: BeautifulSoup):
        """Optimiert Script-Tags für Performance"""
        for script in soup.find_all('script', src=True):
            src = script.get('src', '')

            # Blog-Enhancements können defer werden
            if 'blog-enhancements.js' in src or 'modern-interactions.js' in src:
                if not script.get('defer') and not script.get('async'):
                    script['defer'] = ''

    def _optimize_meta_tags(self, soup: BeautifulSoup):
        """Optimiert Meta-Tags"""
        head = soup.find('head')
        if not head:
            return

        # Füge viewport meta hinzu falls nicht vorhanden
        if not head.find('meta', attrs={'name': 'viewport'}):
            meta = soup.new_tag(
                'meta',
                attrs={
                    'name': 'viewport',
                    'content': 'width=device-width, initial-scale=1.0'
                }
            )
            head.insert(1, meta)


class HTMLOptimizer:
    """Haupt-Orchestrator für HTML-Optimierung"""

    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.wp_cleaner = WordPressLegacyCleaner()
        self.semantic_optimizer = SemanticHTMLOptimizer()
        self.performance_optimizer = PerformanceOptimizer()
        self.stats = {
            'processed': 0,
            'optimized': 0,
            'errors': 0
        }

    def optimize_file(self, file_path: Path) -> Tuple[bool, str]:
        """Optimiert eine einzelne HTML-Datei"""
        try:
            # Lese Datei
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse HTML
            soup = BeautifulSoup(content, 'html.parser')

            # Originalgröße
            original_size = len(content)

            # Wende Optimierungen an
            soup = self.wp_cleaner.clean(soup)
            soup = self.semantic_optimizer.optimize(soup)
            soup = self.performance_optimizer.optimize(soup, file_path)

            # Generiere optimiertes HTML
            optimized_html = str(soup)
            optimized_size = len(optimized_html)

            # Berechne Ersparnis
            savings = original_size - optimized_size
            savings_pct = (savings / original_size * 100) if original_size > 0 else 0

            # Schreibe zurück (wenn nicht dry-run)
            if not self.dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(optimized_html)

            self.stats['optimized'] += 1

            return True, f"{savings_pct:+.1f}%"

        except Exception as e:
            self.stats['errors'] += 1
            return False, str(e)

    def optimize_all(self, html_files: List[Path]):
        """Optimiert alle HTML-Dateien parallel"""
        print(f"\n⚡ Optimiere {len(html_files)} HTML-Dateien...")
        print(f"   {'DRY RUN - ' if self.dry_run else ''}Parallel-Processing mit 5 Workers\n")

        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_file = {
                executor.submit(self.optimize_file, f): f
                for f in html_files
            }

            for i, future in enumerate(as_completed(future_to_file), 1):
                file_path = future_to_file[future]
                self.stats['processed'] += 1

                try:
                    success, result = future.result()
                    status = "✓" if success else "✗"
                    print(f"   [{i}/{len(html_files)}] {status} {file_path.name:50} {result}")

                except Exception as e:
                    print(f"   [{i}/{len(html_files)}] ✗ {file_path.name:50} Error: {e}")


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='HTML Optimization & WordPress Legacy Cleanup'
    )
    parser.add_argument(
        '--analyze',
        action='store_true',
        help='Nur analysieren, keine Änderungen'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Optimierungen simulieren ohne zu speichern'
    )

    args = parser.parse_args()

    print("=" * 60)
    print("🚀 HTML OPTIMIZATION & CLEANUP")
    print("=" * 60)

    # Finde alle HTML-Dateien
    base_dir = Path(__file__).parent.parent
    html_files = [
        f for f in base_dir.glob('*.html')
        if f.name not in ['404.html']  # Skip 404
    ]

    print(f"📁 Gefunden: {len(html_files)} HTML-Dateien")

    # ANALYSE-MODUS
    if args.analyze:
        print("\n🔍 ANALYSE-MODUS\n")
        analyzer = HTMLAnalyzer()
        results = analyzer.analyze_all(html_files)

        print("\n" + "=" * 60)
        print("📊 ANALYSE-ERGEBNISSE")
        print("=" * 60)

        total = results['total']
        for issue, count in sorted(total.items(), key=lambda x: -x[1]):
            if count > 0:
                print(f"   {issue:25} {count:6} Vorkommen")

        # Speichere detaillierte Ergebnisse
        report_file = base_dir / 'data' / 'html-analysis-report.json'
        report_file.parent.mkdir(exist_ok=True)

        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        print(f"\n   📄 Detaillierter Report: {report_file}")

    # OPTIMIERUNGS-MODUS
    else:
        optimizer = HTMLOptimizer(dry_run=args.dry_run)
        optimizer.optimize_all(html_files)

        print("\n" + "=" * 60)
        print("📊 OPTIMIERUNGS-REPORT")
        print("=" * 60)
        print(f"   Verarbeitet:  {optimizer.stats['processed']:3} Dateien")
        print(f"   Optimiert:    {optimizer.stats['optimized']:3} Dateien")
        print(f"   Fehler:       {optimizer.stats['errors']:3} Dateien")
        print("=" * 60)

        if args.dry_run:
            print("\n   ℹ️  DRY RUN - Keine Änderungen gespeichert")
        else:
            print("\n   ✅ Optimierung abgeschlossen!")


if __name__ == '__main__':
    main()
