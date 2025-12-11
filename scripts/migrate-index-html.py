#!/usr/bin/env python3
"""
Migrate index.html to CSP-safe implementation
Removes inline onclick handlers and replaces inline scripts with external file
"""

import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
INDEX_FILE = PROJECT_ROOT / 'index.html'

def migrate_index():
    print("Migrating index.html...")

    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    original_length = len(content)

    # 1. Remove onclick handlers
    onclick_patterns = [
        (r'\s*onclick="bookCall\(\);\s*return false;"', ''),
        (r'\s*onclick="bookCall\(\);\s*closeServiceModal\(\);\s*return false;"', ''),
        (r'\s*onclick="bookRetreat\(\);\s*return false;"', ''),
        (r'\s*onclick="bookRetreat\(\);\s*closeServiceModal\(\);\s*return false;"', ''),
        (r'\s*onclick="selectQuizOption\(this\)"', ''),
        (r'\s*onclick="openVideoModal\([^)]*\)"', ''),
        (r'\s*onclick="closeVideoModal\(event\)"', ''),
        (r'\s*onclick="closeServiceModal\(\)"', ''),
        (r'\s*onclick="toggleService\(this\)"', ''),
        (r'\s*onclick="toggleFaq\(this\)"', ''),
        (r'\s*onclick="toggleMethodDetail\(this\)"', ''),
        (r'\s*onclick="toggleReadingList\([^)]*\)"', ''),
        (r'\s*onclick="openReadingList\(\)"', ''),
        (r'\s*onclick="closeReadingList\(\)"', ''),
        (r'\s*onclick="removeFromReadingList\(\d+\)"', ''),
    ]

    onclick_count = 0
    for pattern, replacement in onclick_patterns:
        content, n = re.subn(pattern, replacement, content)
        onclick_count += n

    print(f"  Removed {onclick_count} onclick handlers")

    # 2. Remove inline script blocks (keep Cal.com embed)
    # Find and remove the bookings count script
    bookings_pattern = r'<script>\s*// Dynamische Anzahl der Buchungen.*?</script>'
    content = re.sub(bookings_pattern, '', content, flags=re.DOTALL)

    # Remove the main functions script block (after Cal.com)
    # This is the block starting with "// Show floating CTA after scrolling"
    main_script_pattern = r'<script>\s*// Show floating CTA after scrolling.*?</script>'
    content = re.sub(main_script_pattern, '', content, flags=re.DOTALL)

    # Remove the blog/reading list script block
    blog_script_pattern = r'<script>\s*// Close on Escape key.*?toggleContactDropdown.*?</script>'
    content = re.sub(blog_script_pattern, '', content, flags=re.DOTALL)

    print("  Removed inline script blocks")

    # 3. Add external JS file reference before </body>
    # Check if it already exists
    if 'js/pages/index.js' not in content:
        content = content.replace(
            '<script defer src="js/global.js"></script>',
            '<script defer src="js/pages/index.js"></script>\n<script defer src="js/global.js"></script>'
        )
        print("  Added js/pages/index.js reference")

    # 4. Clean up any double newlines created
    content = re.sub(r'\n{3,}', '\n\n', content)

    # Write back
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        f.write(content)

    new_length = len(content)
    print(f"\nMigration complete!")
    print(f"  Original size: {original_length} chars")
    print(f"  New size: {new_length} chars")
    print(f"  Reduced by: {original_length - new_length} chars")

if __name__ == '__main__':
    migrate_index()
