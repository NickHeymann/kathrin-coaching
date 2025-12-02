#!/usr/bin/env python3
"""
Add modern design CSS and JS to all HTML files
"""

import os
import re
import glob

# CSS to add before </head>
CSS_LINK = '''
    <!-- Modern Design Overhaul -->
    <link rel="stylesheet" href="modern-design.css" type="text/css" media="all" />
'''

# JS to add before </body>
JS_LINK = '''
    <!-- Modern Interactions -->
    <script src="modern-interactions.js"></script>
'''

def add_modern_design(filepath):
    """Add modern CSS and JS to a single HTML file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        modified = False

        # Check if already added
        if 'modern-design.css' in content:
            return False

        # Get relative path prefix for subdirectories
        depth = filepath.count(os.sep)
        prefix = '../' * depth if depth > 0 else ''

        # Adjust paths for subdirectories
        css_link = CSS_LINK.replace('href="', f'href="{prefix}')
        js_link = JS_LINK.replace('src="', f'src="{prefix}')

        # Also update cal-booking.js path if in subdirectory
        if prefix:
            js_link = js_link.replace(f'src="{prefix}cal-booking.js"', f'src="{prefix}cal-booking.js"')

        # Add CSS before </head>
        if '</head>' in content and 'modern-design.css' not in content:
            content = content.replace('</head>', css_link + '</head>')
            modified = True

        # Add JS before </body>
        if '</body>' in content and 'modern-interactions.js' not in content:
            content = content.replace('</body>', js_link + '</body>')
            modified = True

        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False

    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    # Find all HTML files
    html_files = glob.glob('*.html') + glob.glob('**/*.html', recursive=True)

    # Filter out temp files
    html_files = [f for f in html_files if not f.endswith('.tmp')]

    updated = 0
    skipped = 0

    for filepath in html_files:
        if add_modern_design(filepath):
            print(f"✓ Updated: {filepath}")
            updated += 1
        else:
            skipped += 1

    print(f"\n=== Summary ===")
    print(f"Updated: {updated} files")
    print(f"Skipped: {skipped} files")

if __name__ == "__main__":
    main()
