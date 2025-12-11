#!/usr/bin/env python3
"""
Migrate admin tools to CSP-safe implementation
Removes onclick handlers, adds data-action attributes
"""

import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent

ADMIN_FILES = [
    'blog-editor-modular.html',
    'cms/index.html',
    'studio.html',
    'admin/dashboard.html',
    'admin-wip/dashboard.html',
    'cms/analytics/index.html'
]

# Map onclick handlers to data-action attributes
ONCLICK_MAPPINGS = [
    # Simple function calls - extract function name as action
    (r'onclick="(\w+)\(\)"', r'data-action="\1"'),

    # Function with 'this' parameter
    (r'onclick="(\w+)\(this\)"', r'data-action="\1"'),

    # showTab with string parameter
    (r"onclick=\"showTab\('(\w+)'\)\"", r'data-action="showTab" data-tab="\1"'),

    # setBlockType with parameters
    (r"onclick=\"setBlockType\('([^']+)',\s*'([^']+)'\)\"", r'data-action="setBlockType" data-type="\1" data-label="\2"'),

    # CMS.function() calls
    (r'onclick="CMS\.(\w+)\(\)"', r'data-action="CMS.\1"'),

    # CMS.function(this) calls
    (r'onclick="CMS\.(\w+)\(this\)"', r'data-action="CMS.\1"'),

    # SharedUI calls
    (r"onclick=\"SharedUI\.mobileSidebar\.open\('(\w+)'\)\"", r'data-action="openSidebar" data-sidebar="\1"'),

    # CMS.closeSidebar
    (r"onclick=\"CMS\.closeSidebar\('(\w+)'\)\"", r'data-action="closeSidebar" data-sidebar="\1"'),

    # CMS.filterNotes
    (r"onclick=\"CMS\.filterNotes\('(\w+)'\)\"", r'data-action="filterNotes" data-filter="\1"'),

    # CMS.switchVideoTab
    (r"onclick=\"CMS\.switchVideoTab\('(\w+)'\)\"", r'data-action="switchVideoTab" data-tab="\1"'),

    # Chained calls (remove completely, handle in JS)
    (r'onclick="[^"]*;\s*[^"]*"', ''),

    # addBlockAfter with type
    (r"onclick=\"addBlockAfter\(this\.closest\('\.content-block'\),\s*'(\w+)'\)\"", r'data-action="addBlockAfter" data-type="\1"'),
]

def migrate_file(filepath):
    """Migrate a single admin file"""
    print(f"\nMigrating {filepath}...")

    if not filepath.exists():
        print(f"  File not found, skipping")
        return 0

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_length = len(content)
    onclick_count = 0

    for pattern, replacement in ONCLICK_MAPPINGS:
        content, n = re.subn(pattern, replacement, content)
        onclick_count += n

    # Clean up any remaining simple onclick handlers
    # onclick="functionName()" -> data-action="functionName"
    content, n = re.subn(
        r'onclick="([a-zA-Z_][a-zA-Z0-9_]*)\(\)"',
        r'data-action="\1"',
        content
    )
    onclick_count += n

    # Clean up empty onclick attributes
    content = re.sub(r'\s+onclick=""', '', content)

    # Add event delegation script reference if not present
    if 'blog-editor-events.js' not in content and 'blog-editor' in str(filepath):
        content = content.replace(
            '<script src="js/blog-editor-core.js">',
            '<script src="js/blog-editor-events.js"></script>\n<script src="js/blog-editor-core.js">'
        )
        print("  Added blog-editor-events.js reference")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    new_length = len(content)
    print(f"  Processed {onclick_count} onclick handlers")
    print(f"  Size: {original_length} -> {new_length} chars")

    return onclick_count

def main():
    print("=" * 50)
    print("Admin Tools CSP Migration")
    print("=" * 50)

    total_onclick = 0

    for filename in ADMIN_FILES:
        filepath = PROJECT_ROOT / filename
        count = migrate_file(filepath)
        total_onclick += count

    print("\n" + "=" * 50)
    print(f"Migration complete!")
    print(f"Total onclick processed: {total_onclick}")
    print("=" * 50)

if __name__ == '__main__':
    main()
