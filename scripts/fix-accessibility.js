#!/usr/bin/env node
/**
 * Accessibility Fixer
 * Scans HTML files and reports/fixes accessibility issues
 *
 * Usage: node scripts/fix-accessibility.js [--fix]
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';

const ROOT = process.cwd();
const HTML_EXTENSIONS = ['.html', '.htm'];
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'scripts', 'wp-json', 'wp-content/plugins'];
const FIX_MODE = process.argv.includes('--fix');

const issues = {
    missingAlt: [],
    emptyAlt: [],
    missingAriaLabel: [],
    missingLang: [],
    missingTitle: []
};

async function getHtmlFiles(dir = ROOT) {
    const files = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = fullPath.replace(ROOT + '/', '');

        if (entry.isDirectory()) {
            if (SKIP_DIRS.some(skip => relativePath.startsWith(skip))) continue;
            files.push(...await getHtmlFiles(fullPath));
        } else if (HTML_EXTENSIONS.includes(extname(entry.name).toLowerCase())) {
            files.push(fullPath);
        }
    }

    return files;
}

function findAccessibilityIssues(content, filePath) {
    const relativePath = filePath.replace(ROOT + '/', '');
    let lineNumber = 0;

    // Check for images without alt attribute
    const imgWithoutAlt = content.match(/<img(?![^>]*alt=)[^>]*>/gi) || [];
    imgWithoutAlt.forEach(match => {
        issues.missingAlt.push({ file: relativePath, tag: match.substring(0, 100) });
    });

    // Check for images with empty alt (might be intentional for decorative images)
    const imgEmptyAlt = content.match(/<img[^>]*alt=""[^>]*>/gi) || [];
    imgEmptyAlt.forEach(match => {
        // Only flag if it seems like a content image (has meaningful src)
        if (!match.includes('spacer') && !match.includes('pixel') && !match.includes('icon')) {
            issues.emptyAlt.push({ file: relativePath, tag: match.substring(0, 100) });
        }
    });

    // Check for buttons/links with only icons (no text or aria-label)
    const iconButtons = content.match(/<(button|a)[^>]*>[\s]*(<i|<span[^>]*class="[^"]*icon)[^<]*<\/\1>/gi) || [];
    iconButtons.forEach(match => {
        if (!match.includes('aria-label')) {
            issues.missingAriaLabel.push({ file: relativePath, tag: match.substring(0, 100) });
        }
    });

    // Check for missing lang attribute on html tag
    if (content.includes('<html') && !content.includes('<html lang=') && !content.includes('<html xml:lang=')) {
        issues.missingLang.push({ file: relativePath });
    }

    // Check for missing title tag
    if (!content.includes('<title>') && !content.includes('<title ')) {
        issues.missingTitle.push({ file: relativePath });
    }

    return issues;
}

function generateAltText(src) {
    if (!src) return 'Bild';

    // Extract filename and clean it up
    const filename = basename(src, extname(src));

    // Common patterns to clean up
    const cleaned = filename
        .replace(/-\d+x\d+$/, '') // Remove size suffix like -300x200
        .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
        .replace(/\d{10,}/g, '') // Remove long numbers (timestamps)
        .trim();

    if (!cleaned) return 'Bild';

    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function fixAccessibilityIssues(content) {
    let modified = false;

    // Add alt attribute to images without it
    const fixed = content.replace(/<img(?![^>]*alt=)([^>]*)src="([^"]*)"([^>]*)>/gi, (match, before, src, after) => {
        const altText = generateAltText(src);
        modified = true;
        return `<img${before}src="${src}"${after} alt="${altText}">`;
    });

    return { content: fixed, modified };
}

async function processFile(filePath) {
    try {
        const content = await readFile(filePath, 'utf-8');

        // Find issues
        findAccessibilityIssues(content, filePath);

        // Fix if in fix mode
        if (FIX_MODE) {
            const result = fixAccessibilityIssues(content);
            if (result.modified) {
                await writeFile(filePath, result.content, 'utf-8');
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error(`Error processing ${filePath}:`, e.message);
        return false;
    }
}

async function main() {
    console.log('Accessibility Scanner\n');
    console.log(FIX_MODE ? 'Mode: FIX (will modify files)\n' : 'Mode: REPORT ONLY (use --fix to auto-fix)\n');

    const htmlFiles = await getHtmlFiles();
    console.log(`Found ${htmlFiles.length} HTML files\n`);

    let fixedCount = 0;

    for (const file of htmlFiles) {
        const wasFixed = await processFile(file);
        if (wasFixed) {
            console.log(`  Fixed: ${file.replace(ROOT, '.')}`);
            fixedCount++;
        }
    }

    // Report
    console.log('\n' + '='.repeat(60));
    console.log('ACCESSIBILITY REPORT');
    console.log('='.repeat(60));

    console.log(`\n1. Images without alt attribute: ${issues.missingAlt.length}`);
    if (issues.missingAlt.length > 0 && issues.missingAlt.length <= 10) {
        issues.missingAlt.forEach(i => console.log(`   - ${i.file}`));
    } else if (issues.missingAlt.length > 10) {
        issues.missingAlt.slice(0, 10).forEach(i => console.log(`   - ${i.file}`));
        console.log(`   ... and ${issues.missingAlt.length - 10} more`);
    }

    console.log(`\n2. Images with empty alt (may be intentional): ${issues.emptyAlt.length}`);
    if (issues.emptyAlt.length > 0 && issues.emptyAlt.length <= 5) {
        issues.emptyAlt.forEach(i => console.log(`   - ${i.file}`));
    }

    console.log(`\n3. Interactive elements missing aria-label: ${issues.missingAriaLabel.length}`);
    if (issues.missingAriaLabel.length > 0 && issues.missingAriaLabel.length <= 5) {
        issues.missingAriaLabel.forEach(i => console.log(`   - ${i.file}`));
    }

    console.log(`\n4. Pages missing lang attribute: ${issues.missingLang.length}`);
    if (issues.missingLang.length > 0) {
        issues.missingLang.forEach(i => console.log(`   - ${i.file}`));
    }

    console.log(`\n5. Pages missing title: ${issues.missingTitle.length}`);
    if (issues.missingTitle.length > 0) {
        issues.missingTitle.forEach(i => console.log(`   - ${i.file}`));
    }

    if (FIX_MODE) {
        console.log(`\nFixed ${fixedCount} files.`);
    } else {
        console.log('\nRun with --fix to auto-fix missing alt attributes.');
    }
}

main().catch(console.error);
