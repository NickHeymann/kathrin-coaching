#!/usr/bin/env python3
"""
Optimize HTML files for static hosting:
1. Fix canonical URLs and og:url meta tags
2. Remove unnecessary CSS/JS (WooCommerce, LearnPress, termly.io)
3. Remove broken external links
"""

import os
import re
import glob

# Base URL for the site
BASE_URL = "https://nickheymann.github.io/kathrin-coaching/"

def optimize_html(filepath):
    """Optimize a single HTML file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        filename = os.path.basename(filepath)

        # 1. Fix canonical URLs - replace empty or relative with full URL
        content = re.sub(
            r'<link rel="canonical" href="[^"]*"',
            f'<link rel="canonical" href="{BASE_URL}{filename}"',
            content
        )

        # 2. Fix og:url meta tags
        content = re.sub(
            r'<meta property="og:url" content="[^"]*"',
            f'<meta property="og:url" content="{BASE_URL}{filename}"',
            content
        )

        # 3. Remove termly.io cookie banner script (loads external resources)
        content = re.sub(
            r'<script[^>]*src="[^"]*termly\.io[^"]*"[^>]*>\s*</script>',
            '<!-- termly.io removed for performance -->',
            content
        )

        # 4. Remove WooCommerce CSS (not needed for static site)
        content = re.sub(
            r"<link[^>]*id='woocommerce[^']*-css'[^>]*/?>",
            '',
            content
        )
        content = re.sub(
            r"<link[^>]*id='brands-styles-css'[^>]*/?>",
            '',
            content
        )

        # 5. Remove LearnPress CSS (not needed)
        content = re.sub(
            r"<link[^>]*id='efor-learn-press-css'[^>]*/?>",
            '',
            content
        )

        # 6. Remove WooCommerce inline styles
        content = re.sub(
            r"<style id='woocommerce-inline-inline-css'[^>]*>.*?</style>",
            '',
            content,
            flags=re.DOTALL
        )

        # 7. Remove LearnPress custom CSS
        content = re.sub(
            r"<style id='learn-press-custom-css'>.*?</style>",
            '',
            content,
            flags=re.DOTALL
        )

        # 8. Remove empty CDATA blocks
        content = re.sub(
            r"<script[^>]*>\s*/\* <!\[CDATA\[ \*/\s*/\* \]\]> \*/\s*</script>",
            '',
            content
        )

        # 9. Remove HTTrack comments
        content = re.sub(
            r'<!-- Added by HTTrack -->.*?<!-- /Added by HTTrack -->',
            '',
            content,
            flags=re.DOTALL
        )

        # 10. Remove broken external domain references (relative paths to external sites)
        content = re.sub(
            r'(src|href)="\.\./(?:www\.googletagmanager\.com|fonts\.googleapis\.com|app\.termly\.io|gmpg\.org)[^"]*"',
            r'\1="#"',
            content
        )

        # 11. Clean up multiple empty lines
        content = re.sub(r'\n{3,}', '\n\n', content)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False

    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    # Find all HTML files (not in subdirectories for now)
    html_files = glob.glob('*.html')

    optimized = 0
    skipped = 0

    for filepath in html_files:
        if optimize_html(filepath):
            print(f"✓ Optimized: {filepath}")
            optimized += 1
        else:
            skipped += 1

    print(f"\n=== Summary ===")
    print(f"Optimized: {optimized} files")
    print(f"Unchanged: {skipped} files")

if __name__ == "__main__":
    main()
