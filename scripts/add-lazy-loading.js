#!/usr/bin/env node
/**
 * Add Lazy Loading to Images
 * Adds loading="lazy" attribute to all img tags that don't have it
 *
 * Usage: node scripts/add-lazy-loading.js
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, extname } from 'path';

const ROOT = process.cwd();
const HTML_EXTENSIONS = ['.html', '.htm'];

// Directories to skip
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'scripts', 'wp-json'];

async function getHtmlFiles(dir = ROOT) {
    const files = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
            if (SKIP_DIRS.includes(entry.name)) continue;
            files.push(...await getHtmlFiles(fullPath));
        } else if (HTML_EXTENSIONS.includes(extname(entry.name).toLowerCase())) {
            files.push(fullPath);
        }
    }

    return files;
}

function addLazyLoading(content) {
    let modified = false;

    // Match img tags without loading attribute
    const imgRegex = /<img\s+(?![^>]*loading=)[^>]*>/gi;

    const newContent = content.replace(imgRegex, (match) => {
        // Don't add to images that might be above the fold (hero images)
        if (match.includes('hero') || match.includes('logo') || match.includes('above-fold')) {
            return match;
        }

        modified = true;
        // Add loading="lazy" before the closing >
        return match.replace(/>$/, ' loading="lazy">');
    });

    return { content: newContent, modified };
}

async function processFile(filePath) {
    try {
        const content = await readFile(filePath, 'utf-8');
        const result = addLazyLoading(content);

        if (result.modified) {
            await writeFile(filePath, result.content, 'utf-8');
            return true;
        }
        return false;
    } catch (e) {
        console.error(`Error processing ${filePath}:`, e.message);
        return false;
    }
}

async function main() {
    console.log('Adding lazy loading to images...\n');

    const htmlFiles = await getHtmlFiles();
    console.log(`Found ${htmlFiles.length} HTML files\n`);

    let modifiedCount = 0;

    for (const file of htmlFiles) {
        const wasModified = await processFile(file);
        if (wasModified) {
            console.log(`  Modified: ${file.replace(ROOT, '.')}`);
            modifiedCount++;
        }
    }

    console.log(`\nDone! Modified ${modifiedCount} files.`);
}

main().catch(console.error);
