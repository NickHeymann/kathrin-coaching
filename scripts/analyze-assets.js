#!/usr/bin/env node
/**
 * Asset Analyzer Script
 * Identifies potentially unused WordPress assets
 *
 * Usage: node scripts/analyze-assets.js
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, relative } from 'path';

const ROOT = process.cwd();
const ASSET_DIRS = ['wp-content', 'wp-includes', 'wp-json'];
const HTML_EXTENSIONS = ['.html', '.htm'];
const ASSET_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.ttf', '.eot'];

// Collect all HTML files
async function getHtmlFiles(dir = ROOT) {
    const files = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Skip certain directories
        if (entry.isDirectory()) {
            if (['node_modules', '.git', 'dist', 'scripts', 'src'].includes(entry.name)) continue;
            files.push(...await getHtmlFiles(fullPath));
        } else if (HTML_EXTENSIONS.includes(extname(entry.name).toLowerCase())) {
            files.push(fullPath);
        }
    }

    return files;
}

// Collect all asset files
async function getAssetFiles(dir) {
    const files = [];

    async function scan(currentDir) {
        try {
            const entries = await readdir(currentDir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = join(currentDir, entry.name);

                if (entry.isDirectory()) {
                    await scan(fullPath);
                } else if (ASSET_EXTENSIONS.includes(extname(entry.name).toLowerCase())) {
                    const stats = await stat(fullPath);
                    files.push({
                        path: fullPath,
                        relativePath: relative(ROOT, fullPath),
                        size: stats.size
                    });
                }
            }
        } catch (e) {
            // Skip inaccessible directories
        }
    }

    await scan(dir);
    return files;
}

// Extract referenced files from HTML content
function extractReferences(content) {
    const refs = new Set();

    // CSS links
    const cssRegex = /href=["']([^"']+\.css[^"']*?)["']/gi;
    let match;
    while ((match = cssRegex.exec(content)) !== null) {
        refs.add(cleanPath(match[1]));
    }

    // JS scripts
    const jsRegex = /src=["']([^"']+\.js[^"']*?)["']/gi;
    while ((match = jsRegex.exec(content)) !== null) {
        refs.add(cleanPath(match[1]));
    }

    // Images
    const imgRegex = /(?:src|srcset|data-src|data-bg)=["']([^"']+?)["']/gi;
    while ((match = imgRegex.exec(content)) !== null) {
        const urls = match[1].split(',');
        urls.forEach(url => {
            const clean = url.trim().split(' ')[0];
            if (ASSET_EXTENSIONS.some(ext => clean.toLowerCase().includes(ext))) {
                refs.add(cleanPath(clean));
            }
        });
    }

    // CSS url()
    const urlRegex = /url\(["']?([^"')]+)["']?\)/gi;
    while ((match = urlRegex.exec(content)) !== null) {
        if (ASSET_EXTENSIONS.some(ext => match[1].toLowerCase().includes(ext))) {
            refs.add(cleanPath(match[1]));
        }
    }

    return refs;
}

function cleanPath(path) {
    // Remove query strings and hashes
    let clean = path.split('?')[0].split('#')[0];
    // Remove leading slash or ./
    clean = clean.replace(/^\.?\//, '');
    return clean;
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function main() {
    console.log('🔍 Analyzing assets...\n');

    // Get all HTML files
    console.log('📄 Scanning HTML files...');
    const htmlFiles = await getHtmlFiles();
    console.log(`   Found ${htmlFiles.length} HTML files\n`);

    // Collect all references
    console.log('🔗 Extracting asset references...');
    const allRefs = new Set();

    for (const htmlFile of htmlFiles) {
        const content = await readFile(htmlFile, 'utf-8');
        const refs = extractReferences(content);
        refs.forEach(ref => allRefs.add(ref));
    }
    console.log(`   Found ${allRefs.size} unique references\n`);

    // Get all assets
    console.log('📁 Scanning asset directories...');
    let allAssets = [];
    for (const dir of ASSET_DIRS) {
        const assets = await getAssetFiles(join(ROOT, dir));
        allAssets.push(...assets);
    }
    console.log(`   Found ${allAssets.length} asset files\n`);

    // Find unused assets
    const unusedAssets = allAssets.filter(asset => {
        const relativePath = asset.relativePath;
        // Check if any reference contains this path
        return !Array.from(allRefs).some(ref =>
            ref.includes(relativePath) ||
            relativePath.includes(ref) ||
            ref.endsWith(relativePath.split('/').pop())
        );
    });

    // Calculate sizes
    const totalSize = allAssets.reduce((sum, a) => sum + a.size, 0);
    const unusedSize = unusedAssets.reduce((sum, a) => sum + a.size, 0);

    // Report
    console.log('=' .repeat(60));
    console.log('📊 ANALYSIS REPORT');
    console.log('=' .repeat(60));
    console.log(`Total assets:    ${allAssets.length} files (${formatSize(totalSize)})`);
    console.log(`Potentially unused: ${unusedAssets.length} files (${formatSize(unusedSize)})`);
    console.log(`Potential savings:  ${((unusedSize / totalSize) * 100).toFixed(1)}%`);
    console.log('');

    // Group unused by directory
    const byDir = {};
    unusedAssets.forEach(asset => {
        const dir = asset.relativePath.split('/').slice(0, 3).join('/');
        if (!byDir[dir]) byDir[dir] = { count: 0, size: 0 };
        byDir[dir].count++;
        byDir[dir].size += asset.size;
    });

    console.log('📂 Potentially unused by directory:');
    Object.entries(byDir)
        .sort((a, b) => b[1].size - a[1].size)
        .slice(0, 15)
        .forEach(([dir, info]) => {
            console.log(`   ${dir}: ${info.count} files (${formatSize(info.size)})`);
        });

    console.log('\n⚠️  Note: This analysis is conservative. Some assets may be');
    console.log('   loaded dynamically via JavaScript and falsely flagged.');
    console.log('   Always test thoroughly before removing files.');
}

main().catch(console.error);
