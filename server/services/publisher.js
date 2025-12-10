/* GitHub Publisher Service
 * ~120 Zeilen | Automatisches Publishing zu GitHub Pages
 */

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const REPO_CONFIG = {
    owner: 'nickheymann',
    repo: 'kathrin-coaching',
    branch: 'main'
};

/**
 * Generiert HTML für Blog-Artikel
 */
function generateBlogHTML(post) {
    const content = typeof post.content === 'string'
        ? JSON.parse(post.content)
        : post.content;

    const blocksHTML = content.blocks
        ? content.blocks.map(block => block.content).join('\n')
        : content;

    const categoriesHTML = (post.categories || [])
        .map(cat => `<span class="category">${cat}</span>`)
        .join('');

    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} - Kathrin Stahl Coaching</title>
    <meta name="description" content="${post.excerpt || ''}">
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/pages/blog.css">
    <script defer data-domain="kathrinstahl.com" src="https://analytics.kathrinstahl.com/script.js"></script>
</head>
<body>
    <header><!-- Header wird per JS geladen --></header>

    <main class="blog-article">
        <article>
            <header class="article-header">
                ${post.featured_image ? `<img src="${post.featured_image}" alt="${post.title}" class="featured-image">` : ''}
                <div class="article-meta">
                    <time datetime="${post.published_at || new Date().toISOString()}">${formatDate(post.scheduled_for)}</time>
                    <div class="categories">${categoriesHTML}</div>
                </div>
                <h1>${post.title}</h1>
            </header>

            <div class="article-content">
                ${blocksHTML}
            </div>
        </article>
    </main>

    <footer><!-- Footer wird per JS geladen --></footer>
    <script src="js/core/navigation.js"></script>
    <script src="js/pages/blog.js"></script>
</body>
</html>`;
}

/**
 * Formatiert Datum deutsch
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Veröffentlicht Post zu GitHub
 */
async function publishToGitHub(post, pool) {
    try {
        const content = generateBlogHTML(post);
        const path = `blog/${post.slug}.html`;

        // Prüfe ob Datei existiert
        let sha;
        try {
            const existing = await octokit.repos.getContent({
                ...REPO_CONFIG,
                path
            });
            sha = existing.data.sha;
        } catch (e) {
            // Datei existiert nicht - OK
        }

        // Erstelle/Update Datei
        await octokit.repos.createOrUpdateFileContents({
            ...REPO_CONFIG,
            path,
            message: `📝 Auto-publish: ${post.title}`,
            content: Buffer.from(content).toString('base64'),
            sha
        });

        // Status in DB aktualisieren
        await pool.query(`
            UPDATE scheduled_posts
            SET status = 'published', published_at = NOW(), error_message = NULL
            WHERE id = $1
        `, [post.id]);

        console.log(`✅ Published: ${post.title}`);
        return true;

    } catch (error) {
        console.error(`❌ Publish failed: ${post.title}`, error.message);

        // Fehler in DB speichern
        await pool.query(`
            UPDATE scheduled_posts
            SET status = 'failed', error_message = $2
            WHERE id = $1
        `, [post.id, error.message]);

        return false;
    }
}

module.exports = { publishToGitHub, generateBlogHTML };
