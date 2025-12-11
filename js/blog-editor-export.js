/* blog-editor-export.js
 * Export Functions (Markdown, PDF, HTML)
 * Zeilen: ~280 | Verantwortung: Export in verschiedene Formate
 * Abhängigkeiten: blog-editor-config.js, blog-editor-utils.js
 */

// ============================================
// EXPORT MODAL
// ============================================

function openExportModal() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    const modal = document.getElementById('exportModal');
    if (modal) {
        const previewTitle = modal.querySelector('.export-preview-title');
        if (previewTitle) {
            previewTitle.textContent = state.currentPost.title || 'Ohne Titel';
        }
        modal.classList.add('open');
    }
}

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.remove('open');
}

// ============================================
// MARKDOWN EXPORT
// ============================================

function exportAsMarkdown() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    saveCurrentPostToState();

    const post = state.currentPost;
    const markdown = htmlToMarkdown(post.content);

    const frontmatter = `---
title: "${(post.title || 'Ohne Titel').replace(/"/g, '\\"')}"
date: ${post.createdAt || new Date().toISOString()}
categories: [${post.categories.map(c => `"${c}"`).join(', ')}]
excerpt: "${(post.excerpt || '').replace(/"/g, '\\"')}"
${post.featuredImage ? `featured_image: "${post.featuredImage}"` : ''}
---

`;

    const fullMarkdown = frontmatter + markdown;

    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (post.slug || generateSlug(post.title) || 'beitrag') + '.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    closeExportModal();
    toast('Als Markdown exportiert', 'success');
}

function htmlToMarkdown(html) {
    if (!html) return '';

    let md = html;

    md = md.replace(/\r\n/g, '\n');

    // Überschriften
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

    // Formatierung
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    md = md.replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_');
    md = md.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');
    md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');

    // Links & Bilder
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
    md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)');
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

    // Blockquotes
    md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
        return content.split('\n').map(line => '> ' + line.trim()).join('\n') + '\n\n';
    });

    // Code
    md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Listen
    md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
    });
    md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
        let counter = 0;
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
            counter++;
            return `${counter}. ` + arguments[1] + '\n';
        }) + '\n';
    });

    // Sonstiges
    md = md.replace(/<hr[^>]*\/?>/gi, '\n---\n\n');
    md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
    md = md.replace(/<br[^>]*\/?>/gi, '  \n');
    md = md.replace(/<div[^>]*class="[^"]*callout[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, '> **Hinweis:** $1\n\n');
    md = md.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '$1\n\n');

    // Tags entfernen
    md = md.replace(/<[^>]+>/g, '');

    // HTML-Entities
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&quot;/g, '"');
    md = md.replace(/&#039;/g, "'");

    md = md.replace(/\n{3,}/g, '\n\n');

    return md.trim();
}

// ============================================
// PDF EXPORT
// ============================================

function exportAsPDF() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    saveCurrentPostToState();

    const post = state.currentPost;
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
        toast('Popup-Blocker aktiv. Bitte erlaube Popups für diese Seite.', 'error');
        return;
    }

    const printContent = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(post.title || 'Beitrag')} - PDF Export</title>
    <style>
        * { box-sizing: border-box; }
        @page { margin: 2.5cm; size: A4; }
        body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        h1 { font-family: 'Gilda Display', Georgia, serif; color: #2C4A47; font-size: 24pt; margin-bottom: 0.5em; line-height: 1.2; }
        h2 { font-family: 'Gilda Display', Georgia, serif; color: #2C4A47; font-size: 18pt; margin-top: 1.5em; margin-bottom: 0.5em; page-break-after: avoid; }
        h3 { font-family: 'Gilda Display', Georgia, serif; color: #2C4A47; font-size: 14pt; margin-top: 1.2em; margin-bottom: 0.4em; page-break-after: avoid; }
        p { margin: 0 0 1em 0; text-align: justify; orphans: 3; widows: 3; }
        .meta { color: #666; font-size: 10pt; margin-bottom: 2em; padding-bottom: 1em; border-bottom: 1px solid #ddd; }
        .featured-image { width: 100%; max-height: 300px; object-fit: cover; margin-bottom: 1.5em; page-break-inside: avoid; }
        blockquote { margin: 1.5em 0; padding: 1em 1.5em; border-left: 4px solid #D2AB74; background: #f9f7f4; font-style: italic; page-break-inside: avoid; }
        ul, ol { margin: 1em 0; padding-left: 2em; }
        li { margin-bottom: 0.3em; }
        img { max-width: 100%; height: auto; page-break-inside: avoid; }
        a { color: #2C4A47; text-decoration: underline; }
        .footer { margin-top: 3em; padding-top: 1em; border-top: 1px solid #ddd; font-size: 10pt; color: #666; text-align: center; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
</head>
<body>
    <h1>${escapeHtml(post.title || 'Ohne Titel')}</h1>
    <div class="meta">
        Von Kathrin Stahl &bull; ${formatDate(post.createdAt || new Date().toISOString())} &bull;
        ${calculateReadingTime(countWords(stripHtml(post.content)))} Min. Lesezeit
        ${post.categories.length > 0 ? `<br>Kategorien: ${post.categories.map(c => BLOG_CATEGORIES[c] || c).join(', ')}` : ''}
    </div>
    ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${escapeHtml(post.featuredImageAlt || '')}" class="featured-image">` : ''}
    <div class="content">${post.content}</div>
    <div class="footer">Kathrin Stahl Coaching<br>www.kathrinstahl.com</div>
    <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
</body>
</html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();

    closeExportModal();
    toast('PDF-Export wird vorbereitet...', 'info');
}

// ============================================
// HTML EXPORT
// ============================================

function exportAsHTML() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    saveCurrentPostToState();

    const post = state.currentPost;
    const html = generateBlogPostHTML(post);

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (post.slug || generateSlug(post.title) || 'beitrag') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    closeExportModal();
    toast('Als HTML exportiert', 'success');
}

// ============================================
// COPY TO CLIPBOARD
// ============================================

async function copyAsMarkdown() {
    if (!state.currentPost) {
        toast('Kein Beitrag ausgewählt', 'error');
        return;
    }

    saveCurrentPostToState();

    const markdown = htmlToMarkdown(state.currentPost.content);

    try {
        await navigator.clipboard.writeText(markdown);
        closeExportModal();
        toast('Markdown in Zwischenablage kopiert', 'success');
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        closeExportModal();
        toast('Markdown in Zwischenablage kopiert', 'success');
    }
}
