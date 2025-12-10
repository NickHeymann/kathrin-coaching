#!/usr/bin/env python3
"""
Update all HTML files to use the master header component.
This script:
1. Replaces existing <header>...</header> with <div id="header-placeholder"></div>
2. Adds the header-loader.js script before </body>
3. Removes inline header CSS from <style> blocks (in quiz pages)
"""

import os
import re
from pathlib import Path

# Files to skip (they have special requirements or are templates)
SKIP_FILES = [
    'components/header.html',
    'blog-editor.html',
    'blog-editor-modular.html',
    'cms-editor.html',
    'cms/index.html',
]

def remove_inline_header_css(content):
    """Remove header-related CSS from inline <style> blocks."""
    # Pattern to match header CSS sections in style blocks
    patterns_to_remove = [
        # Match header section comments and rules
        r'/\* ===== HEADER ===== \*/.*?(?=/\* ===== [A-Z]|</style>)',
        r'/\* ===== DROPDOWN NAVIGATION ===== \*/.*?(?=/\* ===== [A-Z]|</style>)',
        # Match individual header rules
        r'header\s*\{[^}]+\}',
        r'\.header-inner\s*\{[^}]+\}',
        r'\.logo\s*\{[^}]+\}',
        r'nav\s*\{[^}]+\}',
        r'nav\s+a\s*\{[^}]+\}',
        r'nav\s+a:hover\s*\{[^}]+\}',
        r'\.nav-cta\s*\{[^}]+\}',
        r'\.nav-cta:hover\s*\{[^}]+\}',
        r'\.menu-toggle\s*\{[^}]+\}',
        r'\.menu-toggle\s+span\s*\{[^}]+\}',
        r'\.nav-dropdown[^{]*\{[^}]+\}',
        r'\.dropdown-menu[^{]*\{[^}]+\}',
        r'\.dropdown-icon[^{]*\{[^}]+\}',
        r'\.dropdown-text[^{]*\{[^}]+\}',
        r'\.contact-dropdown[^{]*\{[^}]+\}',
    ]

    for pattern in patterns_to_remove:
        content = re.sub(pattern, '', content, flags=re.DOTALL)

    return content

def update_html_file(filepath):
    """Update a single HTML file to use the master header."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Check if already using header-loader
    if 'header-loader.js' in content:
        print(f"  Skipping {filepath} - already using header-loader")
        return False

    # Check if file has a header
    if '<header>' not in content and '<header ' not in content:
        print(f"  Skipping {filepath} - no header found")
        return False

    # 1. Replace the header block with placeholder
    # Match <header>...</header> including attributes
    header_pattern = r'<header[^>]*>.*?</header>'
    if re.search(header_pattern, content, re.DOTALL):
        content = re.sub(
            header_pattern,
            '<div id="header-placeholder"></div>',
            content,
            flags=re.DOTALL
        )

    # 2. Add header-loader.js before </body>
    # First, remove any existing navigation JS that's now in header-loader.js
    nav_js_patterns = [
        r'// Mobile Navigation Toggle\s*\n\s*function toggleMobileNav\(\).*?(?=</script>|// [A-Z])',
        r'// Dropdown toggle.*?(?=</script>|// [A-Z])',
        r'// Contact dropdown.*?(?=</script>|// [A-Z])',
        r'// Close.*?dropdowns?.*?(?=</script>|// [A-Z])',
        r'function toggleMobileNav\(\)\s*\{[^}]+\}',
        r'function toggleDropdown\([^)]+\)\s*\{[^}]+\}',
        r'function toggleContactDropdown\([^)]+\)\s*\{[^}]+\}',
        r'function bookCall\(\)\s*\{[^}]+\}',
    ]

    # Add header-loader.js script before </body>
    if '</body>' in content:
        # Check if there's already a scripts section
        script_tag = '<script src="js/header-loader.js"></script>\n'
        if script_tag not in content:
            content = content.replace('</body>', f'{script_tag}</body>')

    # 3. Remove inline header CSS from style blocks (mainly for quiz pages)
    # Only do this if file has inline styles
    if '<style>' in content:
        content = remove_inline_header_css(content)

    # Check if anything changed
    if content == original_content:
        print(f"  No changes needed for {filepath}")
        return False

    # Write the updated content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  Updated {filepath}")
    return True

def main():
    """Main function to update all HTML files."""
    root_dir = Path(__file__).parent.parent

    updated_count = 0
    skipped_count = 0

    # Find all HTML files
    html_files = list(root_dir.glob('*.html'))

    print(f"Found {len(html_files)} HTML files in root directory")
    print("-" * 50)

    for html_file in sorted(html_files):
        relative_path = html_file.relative_to(root_dir)

        # Skip certain files
        if str(relative_path) in SKIP_FILES:
            print(f"  Skipping {relative_path} (in skip list)")
            skipped_count += 1
            continue

        if update_html_file(html_file):
            updated_count += 1
        else:
            skipped_count += 1

    print("-" * 50)
    print(f"Updated: {updated_count} files")
    print(f"Skipped: {skipped_count} files")

if __name__ == '__main__':
    main()
