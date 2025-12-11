#!/usr/bin/env python3
"""
Migration Script: Remove inline onclick handlers and scripts
for CSP compliance (unsafe-inline removal)

This script:
1. Removes onclick="toggleDropdown(...)" from nav-dropdown elements
2. Removes onclick="toggleContactDropdown(...)" from contact triggers
3. Removes onclick="toggleMobileNav()" from menu-toggle buttons
4. Removes onclick="selectAnswer(...)" from quiz elements
5. Removes onclick="bookCall()" from CTA buttons
6. Replaces inline bookmark scripts with external script reference
7. Ensures global.js is loaded on all pages
"""

import os
import re
import glob
from pathlib import Path

# Project root
PROJECT_ROOT = Path(__file__).parent.parent

# Statistics
stats = {
    'files_processed': 0,
    'onclick_removed': 0,
    'inline_scripts_replaced': 0,
    'global_js_added': 0,
    'bookmark_js_added': 0,
    'skipped': []
}

def remove_onclick_attributes(content):
    """Remove onclick attributes from HTML elements"""
    count = 0

    # Pattern for onclick attributes (various formats)
    patterns = [
        # toggleDropdown
        (r'\s+onclick="toggleDropdown\([^"]*\)"', ''),
        # toggleContactDropdown
        (r'\s+onclick="toggleContactDropdown\([^"]*\)"', ''),
        # toggleMobileNav
        (r'\s+onclick="toggleMobileNav\(\)"', ''),
        # selectAnswer
        (r'\s+onclick="selectAnswer\([^"]*\)"', ''),
        # bookCall
        (r'\s+onclick="bookCall\(\)"', ''),
        # Generic onclick on CTA buttons (keep data-action)
        (r'(<button[^>]*class="[^"]*cta-button[^"]*"[^>]*)\s+onclick="[^"]*"', r'\1 data-action="bookCall"'),
    ]

    for pattern, replacement in patterns:
        new_content, n = re.subn(pattern, replacement, content, flags=re.IGNORECASE)
        count += n
        content = new_content

    return content, count

def remove_inline_bookmark_script(content):
    """Remove inline bookmark script and add external reference"""

    # Pattern to match the inline bookmark script block
    bookmark_pattern = r'''<script>\s*
\s*const STORAGE_KEY = 'kathrin-blog-library';.*?
\s*updateUI\(\);\s*
\s*</script>'''

    # More flexible pattern
    bookmark_pattern2 = r'<script>\s*const STORAGE_KEY\s*=\s*[\'"]kathrin-blog-library[\'"].*?</script>'

    replaced = False

    for pattern in [bookmark_pattern, bookmark_pattern2]:
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, '', content, flags=re.DOTALL)
            replaced = True
            break

    return content, replaced

def ensure_global_js(content, filepath):
    """Ensure global.js is included in the page"""

    # Skip admin and cms pages (they have different JS loading)
    if '/admin/' in str(filepath) or '/cms/' in str(filepath):
        return content, False

    # Check if global.js is already loaded
    if 'js/global.js' in content or 'global.js' in content:
        return content, False

    # Find the closing </body> tag and add global.js before it
    if '</body>' in content:
        script_tag = '<script defer src="js/global.js"></script>\n</body>'
        content = content.replace('</body>', script_tag)
        return content, True

    return content, False

def ensure_bookmark_js(content, filepath):
    """Add bookmark.js to blog post pages that need it"""

    # Only add to pages with bookmark functionality
    if 'bookmarkBtn' not in content and 'bookmark-floating' not in content:
        return content, False

    # Check if bookmark.js is already loaded
    if 'js/components/bookmark.js' in content:
        return content, False

    # Find position to add script (before </body>)
    if '</body>' in content:
        script_tag = '<script defer src="js/components/bookmark.js"></script>\n</body>'
        content = content.replace('</body>', script_tag)
        return content, True

    return content, False

def process_file(filepath):
    """Process a single HTML file"""

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()
    except Exception as e:
        stats['skipped'].append((str(filepath), str(e)))
        return

    content = original_content
    changes_made = False

    # 1. Remove onclick attributes
    content, onclick_count = remove_onclick_attributes(content)
    if onclick_count > 0:
        stats['onclick_removed'] += onclick_count
        changes_made = True

    # 2. Remove inline bookmark script
    content, bookmark_replaced = remove_inline_bookmark_script(content)
    if bookmark_replaced:
        stats['inline_scripts_replaced'] += 1
        changes_made = True

    # 3. Ensure global.js is loaded
    content, global_added = ensure_global_js(content, filepath)
    if global_added:
        stats['global_js_added'] += 1
        changes_made = True

    # 4. Add bookmark.js if needed
    content, bookmark_added = ensure_bookmark_js(content, filepath)
    if bookmark_added:
        stats['bookmark_js_added'] += 1
        changes_made = True

    # Write changes if any
    if changes_made:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        stats['files_processed'] += 1
        print(f"  ✓ {filepath.name}: {onclick_count} onclick, bookmark={bookmark_replaced}")

def main():
    """Main migration function"""

    print("=" * 60)
    print("CSP Migration: Removing inline scripts and onclick handlers")
    print("=" * 60)

    # Find all HTML files (excluding templates, archive, node_modules)
    html_files = []

    for pattern in ['*.html', '**/*.html']:
        for filepath in PROJECT_ROOT.glob(pattern):
            # Skip certain directories
            skip_dirs = ['_archive', 'node_modules', '.git', 'templates']
            if any(skip in str(filepath) for skip in skip_dirs):
                continue
            html_files.append(filepath)

    # Remove duplicates and sort
    html_files = sorted(set(html_files))

    print(f"\nFound {len(html_files)} HTML files to process\n")

    for filepath in html_files:
        process_file(filepath)

    # Print summary
    print("\n" + "=" * 60)
    print("MIGRATION SUMMARY")
    print("=" * 60)
    print(f"Files modified:        {stats['files_processed']}")
    print(f"onclick removed:       {stats['onclick_removed']}")
    print(f"Inline scripts removed:{stats['inline_scripts_replaced']}")
    print(f"global.js added:       {stats['global_js_added']}")
    print(f"bookmark.js added:     {stats['bookmark_js_added']}")

    if stats['skipped']:
        print(f"\nSkipped files ({len(stats['skipped'])}):")
        for path, reason in stats['skipped']:
            print(f"  - {path}: {reason}")

    print("\n✅ Migration complete!")
    print("\nNext steps:")
    print("1. Test navigation dropdowns on mobile and desktop")
    print("2. Test bookmark functionality on blog posts")
    print("3. Test quiz answer selection")
    print("4. Run: grep -r 'onclick=' *.html | head -20  (should be empty/minimal)")

if __name__ == '__main__':
    main()
