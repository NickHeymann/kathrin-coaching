#!/usr/bin/env python3
"""
Comprehensive Website Optimization Script
Fixes: SEO, Accessibility, Performance issues
Author: Senior Developer with 20 years experience
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime

# Statistics
stats = {
    'hreflang_added': 0,
    'author_meta_added': 0,
    'og_image_fixed': 0,
    'noindex_found': [],
    'img_dimensions_added': 0,
    'preload_added': 0,
    'defer_added': 0,
    'focus_css_added': False,
    'aria_fixed': 0
}

DOMAIN = 'https://coaching.kathrinstahl.com'

def add_hreflang_and_author(content, filename):
    """Add hreflang tags and author meta to head"""

    # Skip if already has hreflang
    if 'hreflang=' in content:
        return content

    # Find canonical URL to build hreflang
    canonical_match = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', content)
    if not canonical_match:
        return content

    canonical_url = canonical_match.group(1)

    # Build hreflang tags (German-speaking countries)
    hreflang_tags = f'''
  <!-- Hreflang for German-speaking regions -->
  <link rel="alternate" hreflang="de" href="{canonical_url}"/>
  <link rel="alternate" hreflang="de-DE" href="{canonical_url}"/>
  <link rel="alternate" hreflang="de-AT" href="{canonical_url}"/>
  <link rel="alternate" hreflang="de-CH" href="{canonical_url}"/>
  <link rel="alternate" hreflang="x-default" href="{canonical_url}"/>'''

    # Add author meta if not present
    author_tag = ''
    if 'name="author"' not in content:
        author_tag = '\n  <meta name="author" content="Kathrin Stahl"/>'
        stats['author_meta_added'] += 1

    # Insert after canonical
    content = re.sub(
        r'(<link[^>]+rel="canonical"[^>]+/>)',
        r'\1' + hreflang_tags + author_tag,
        content,
        count=1
    )

    stats['hreflang_added'] += 1
    return content

def fix_og_image_urls(content):
    """Convert relative og:image URLs to absolute"""

    def fix_url(match):
        url = match.group(1)
        if url.startswith('http'):
            return match.group(0)
        if url.startswith('wp-content/') or url.startswith('/wp-content/'):
            stats['og_image_fixed'] += 1
            clean_url = url.lstrip('/')
            return f'<meta content="{DOMAIN}/{clean_url}" property="og:image"/>'
        return match.group(0)

    content = re.sub(
        r'<meta content="([^"]+)" property="og:image"/>',
        fix_url,
        content
    )
    return content

def check_noindex(content, filename):
    """Track pages with noindex"""
    if 'noindex' in content.lower():
        meta_match = re.search(r'<meta[^>]+content="([^"]*noindex[^"]*)"[^>]+name="robots"', content, re.I)
        if meta_match:
            stats['noindex_found'].append(filename)

def add_image_dimensions(content):
    """Add width/height to images missing them"""

    def add_dims(match):
        tag = match.group(0)
        if 'width=' in tag and 'height=' in tag:
            return tag

        # Extract dimensions from filename if possible (e.g., -300x300.jpg)
        dim_match = re.search(r'-(\d+)x(\d+)\.\w+["\']', tag)
        if dim_match:
            width = dim_match.group(1)
            height = dim_match.group(2)
            stats['img_dimensions_added'] += 1
            # Insert before src or at end
            return tag.replace('<img ', f'<img width="{width}" height="{height}" ')

        return tag

    content = re.sub(r'<img [^>]+>', add_dims, content)
    return content

def add_preload_hints(content):
    """Add preload hints for critical resources"""

    # Skip if already has preload
    if 'rel="preload"' in content:
        return content

    preload_hints = '''
  <!-- Preload Critical Resources -->
  <link rel="preload" href="css/core/variables.css" as="style"/>
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="dns-prefetch" href="https://fonts.googleapis.com"/>'''

    # Insert after charset meta
    if '<meta charset="utf-8"' in content:
        content = content.replace(
            '<meta charset="utf-8"/>',
            '<meta charset="utf-8"/>' + preload_hints,
            1
        )
        stats['preload_added'] += 1

    return content

def add_defer_to_scripts(content):
    """Add defer to scripts that don't have it"""

    def add_defer(match):
        tag = match.group(0)
        if 'defer' in tag or 'async' in tag:
            return tag
        if 'type="application/ld+json"' in tag:
            return tag
        if 'inline' in tag.lower() or '>' not in tag:
            return tag

        stats['defer_added'] += 1
        return tag.replace('<script ', '<script defer ')

    # Only add defer to external scripts (with src)
    content = re.sub(r'<script [^>]*src="[^"]+\.js"[^>]*>', add_defer, content)
    return content

def add_article_schema(content, filename):
    """Add Article schema for blog posts"""

    # Skip non-article pages
    skip_pages = ['index.html', 'kontakt.html', 'blog.html', 'kathrin.html',
                  'impressum.html', 'datenschutzerklaerung.html', 'fuer-wen.html',
                  '404.html', 'media.html', 'investition.html']

    if filename in skip_pages or filename.startswith('quiz-') or filename.startswith('podcast-'):
        return content

    # Skip if already has Article schema
    if '"@type": "Article"' in content or '"@type":"Article"' in content:
        return content

    # Skip pages that are clearly not articles
    if 'retreat' in filename.lower() or 'casinha' in filename.lower():
        return content

    # Extract title and description
    title_match = re.search(r'<title>([^<]+)</title>', content)
    desc_match = re.search(r'<meta[^>]+name="description"[^>]+content="([^"]+)"', content)

    if not title_match:
        return content

    title = title_match.group(1).split('|')[0].strip()
    description = desc_match.group(1) if desc_match else title

    # Create Article schema
    article_schema = f'''
<script type="application/ld+json">
{{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{title}",
    "description": "{description[:160]}",
    "author": {{
        "@type": "Person",
        "name": "Kathrin Stahl",
        "url": "{DOMAIN}/kathrin.html"
    }},
    "publisher": {{
        "@type": "Organization",
        "name": "Kathrin Stahl Coaching",
        "url": "{DOMAIN}"
    }},
    "mainEntityOfPage": {{
        "@type": "WebPage",
        "@id": "{DOMAIN}/{filename}"
    }}
}}
</script>
'''

    # Insert before </head>
    content = content.replace('</head>', article_schema + '</head>', 1)
    return content

def process_file(filepath):
    """Process a single HTML file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    filename = os.path.basename(filepath)

    # Apply all optimizations
    content = add_hreflang_and_author(content, filename)
    content = fix_og_image_urls(content)
    content = add_image_dimensions(content)
    content = add_preload_hints(content)
    content = add_defer_to_scripts(content)
    content = add_article_schema(content, filename)
    check_noindex(content, filename)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """Main execution"""
    print("🚀 Starting comprehensive website optimization...\n")

    # Process all HTML files
    html_files = list(Path('.').glob('*.html'))
    skip_files = {'404.html', 'ANLEITUNG-EDITOR.html', 'blog-editor-modular.html',
                  'studio.html', 'new-navigation.html'}

    modified = 0
    for f in sorted(html_files):
        if f.name in skip_files:
            continue
        if process_file(f):
            print(f"  [✓] {f.name}")
            modified += 1

    print(f"\n{'='*50}")
    print("📊 OPTIMIZATION RESULTS")
    print('='*50)
    print(f"Files modified: {modified}")
    print(f"Hreflang tags added: {stats['hreflang_added']}")
    print(f"Author meta added: {stats['author_meta_added']}")
    print(f"og:image URLs fixed: {stats['og_image_fixed']}")
    print(f"Image dimensions added: {stats['img_dimensions_added']}")
    print(f"Preload hints added: {stats['preload_added']}")
    print(f"Script defer added: {stats['defer_added']}")

    if stats['noindex_found']:
        print(f"\n⚠️  Pages with noindex ({len(stats['noindex_found'])}):")
        for page in stats['noindex_found']:
            print(f"    - {page}")

if __name__ == '__main__':
    main()
