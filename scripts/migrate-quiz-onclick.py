#!/usr/bin/env python3
"""
Migrate quiz pages to CSP-safe implementation
Removes onclick handlers, adds data-value attributes for event delegation
"""

import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
QUIZ_FILES = [
    'quiz-hochsensibel.html',
    'quiz-hochbegabt.html',
    'quiz-beziehung.html',
    'quiz-lebenskrise.html',
    'quiz-midlife.html',
    'quiz-paar-kompass.html'
]

def migrate_quiz(filepath):
    """Migrate a single quiz file"""
    print(f"\nMigrating {filepath.name}...")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_length = len(content)
    onclick_count = 0

    # 1. Remove likert/option onclick handlers, ensure data-value exists
    # Pattern: onclick="selectLikert(this, N)" or onclick="selectOption(this, N)"
    def replace_likert_onclick(match):
        nonlocal onclick_count
        onclick_count += 1
        value = match.group(1)
        # Just remove the onclick, keep data-value if present
        return f'data-value="{value}"'

    # Replace onclick="selectLikert(this, N)" with data-value="N"
    content = re.sub(
        r'onclick="selectLikert\(this,\s*(\d+)\)"',
        replace_likert_onclick,
        content
    )

    # Replace onclick="selectOption(this, N)" with data-value="N"
    content = re.sub(
        r'onclick="selectOption\(this,\s*(\d+)\)"',
        replace_likert_onclick,
        content
    )

    # Replace onclick="selectAnswer(this, N)" with data-value="N"
    content = re.sub(
        r'onclick="selectAnswer\(this,\s*(\d+)\)"',
        replace_likert_onclick,
        content
    )

    # 2. Remove science-box and info-box onclick handlers (delegated in global.js)
    patterns = [
        (r'\s*onclick="toggleScienceBox\(\)"', ''),
        (r'\s*onclick="toggleInfoBox\(\)"', ''),
    ]

    for pattern, replacement in patterns:
        content, n = re.subn(pattern, replacement, content)
        onclick_count += n

    # 3. Remove any frequency-option onclick handlers
    content = re.sub(
        r'onclick="selectFrequency\(this,\s*(\d+)\)"',
        r'data-value="\1"',
        content
    )

    # 4. Clean up duplicate data-value attributes
    content = re.sub(r'data-value="(\d+)"\s+data-value="\1"', r'data-value="\1"', content)

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    new_length = len(content)
    print(f"  Removed {onclick_count} onclick handlers")
    print(f"  Size: {original_length} -> {new_length} chars")

    return onclick_count

def main():
    print("=" * 50)
    print("Quiz Page CSP Migration")
    print("=" * 50)

    total_onclick = 0
    migrated_files = 0

    for filename in QUIZ_FILES:
        filepath = PROJECT_ROOT / filename
        if filepath.exists():
            count = migrate_quiz(filepath)
            total_onclick += count
            migrated_files += 1
        else:
            print(f"\n{filename} not found, skipping")

    print("\n" + "=" * 50)
    print(f"Migration complete!")
    print(f"  Files migrated: {migrated_files}")
    print(f"  Total onclick removed: {total_onclick}")
    print("=" * 50)

if __name__ == '__main__':
    main()
