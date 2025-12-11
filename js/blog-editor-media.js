/* blog-editor-media.js
 * Bilder & Preview Management
 * Zeilen: ~250 | Verantwortung: Image Upload, Gallery, Preview
 * Abhängigkeiten: blog-editor-config.js, blog-editor-github.js
 */

// ============================================
// IMAGE MODAL
// ============================================

function openImageModal() {
    document.getElementById('imageModal').classList.add('open');
    loadImageGallery();
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('open');
    state.selectedImage = null;
}

async function loadImageGallery() {
    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = '<div style="text-align: center; padding: 1rem;">Lade Bilder...</div>';

    const images = await github.listImages();

    if (images.length === 0) {
        gallery.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-light);">Keine Bilder gefunden</div>';
        return;
    }

    gallery.innerHTML = images.map(img => `
        <div class="gallery-item" style="background-image: url('${img.download_url}')" data-url="${img.download_url}" onclick="selectGalleryImage(this)"></div>
    `).join('');
}

function selectGalleryImage(el) {
    document.querySelectorAll('.gallery-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    state.selectedImage = el.dataset.url;
}

function insertSelectedImage() {
    const altText = document.getElementById('imageAltText').value;
    if (state.selectedImage) {
        if (window.currentImageBlockId) {
            updateBlockContent(window.currentImageBlockId, state.selectedImage);
            renderBlocks();
            window.currentImageBlockId = null;
        } else {
            execCmd('insertHTML', `<img src="${state.selectedImage}" alt="${escapeHtml(altText)}" loading="lazy">`);
        }
        closeImageModal();
        toast('Bild eingefügt', 'success');
    } else {
        toast('Bitte ein Bild auswählen', 'error');
    }
}

// ============================================
// IMAGE UPLOAD
// ============================================

async function uploadNewImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast('Bild zu groß (max 10MB)', 'error');
            return;
        }

        toast('Komprimiere und lade hoch...', 'info');

        try {
            const result = await compressImageFile(file, {
                maxWidth: 1600,
                maxHeight: 1200,
                quality: 0.82
            });

            const base64ToUpload = result.compressed;

            let filename = `blog-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
            if (!result.skipped) {
                filename = filename.replace(/\.[^.]+$/, '.jpg');
            }

            await github.uploadImage(filename, base64ToUpload);
            const imageUrl = `wp-content/uploads/blog/${filename}`;

            if (window.currentImageBlockId) {
                updateBlockContent(window.currentImageBlockId, imageUrl);
                renderBlocks();
                window.currentImageBlockId = null;
                closeImageModal();
            } else {
                state.selectedImage = imageUrl;
                loadImageGallery();
            }

            if (!result.skipped && result.savings > 0) {
                const originalSize = formatFileSize(getBase64Size(result.original));
                const newSize = formatFileSize(getBase64Size(result.compressed));
                toast(`Hochgeladen (${originalSize} → ${newSize}, ${result.savings}% gespart)`, 'success');
            } else {
                toast('Bild hochgeladen', 'success');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast('Fehler beim Hochladen: ' + err.message, 'error');
        }
    };

    input.click();
}

async function uploadFeaturedImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast('Bild zu groß (max 10MB)', 'error');
            return;
        }

        toast('Komprimiere und lade hoch...', 'info');

        try {
            const result = await compressImageFile(file, {
                maxWidth: 1200,
                maxHeight: 800,
                quality: 0.85
            });

            const base64ToUpload = result.compressed;

            let filename = `featured-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
            if (!result.skipped) {
                filename = filename.replace(/\.[^.]+$/, '.jpg');
            }

            await github.uploadImage(filename, base64ToUpload);
            state.featuredImage = `wp-content/uploads/blog/${filename}`;

            const upload = document.getElementById('featuredImageUpload');
            upload.innerHTML = `<img src="${base64ToUpload}" alt="" loading="lazy">`;
            upload.classList.add('has-image');
            state.hasUnsavedChanges = true;

            if (!result.skipped && result.savings > 0) {
                const originalSize = formatFileSize(getBase64Size(result.original));
                const newSize = formatFileSize(getBase64Size(result.compressed));
                toast(`Bild hochgeladen (${originalSize} → ${newSize}, ${result.savings}% gespart)`, 'success');
            } else {
                toast('Bild hochgeladen', 'success');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast('Fehler beim Hochladen: ' + err.message, 'error');
        }
    };

    input.click();
}

// ============================================
// PREVIEW
// ============================================

function openPreview() {
    saveCurrentPostToState();
    const frame = document.getElementById('previewFrame');
    frame.innerHTML = generatePreviewHTML(state.currentPost);
    document.getElementById('previewModal').classList.add('open');
}

function closePreview() {
    document.getElementById('previewModal').classList.remove('open');
}

function setPreviewDevice(device) {
    document.querySelectorAll('.preview-device-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(device));
    });
    document.getElementById('previewFrame').className = 'preview-frame ' + device;
}

function generatePreviewHTML(post) {
    return `
        <div style="padding: 2rem; font-family: Georgia, serif; max-width: 800px; margin: 0 auto;">
            <h1 style="font-size: 2.5rem; color: #2c3e50; margin-bottom: 1rem;">${escapeHtml(post?.title || 'Ohne Titel')}</h1>
            <div style="color: #666; margin-bottom: 2rem;">
                Von Kathrin Stahl · ${formatDate(new Date())} · ${calculateReadingTime(post?.content)} Min. Lesezeit
            </div>
            ${post?.featuredImage ? `<img src="${post.featuredImage}" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 2rem;" alt="">` : ''}
            <div style="line-height: 1.8; font-size: 1.1rem;">${post?.content || '<p>Kein Inhalt</p>'}</div>
        </div>
    `;
}

// ============================================
// CUSTOM FONTS
// ============================================

let customFonts = JSON.parse(localStorage.getItem('blog_custom_fonts') || '[]');

function openCustomFontModal() {
    closeAllDropdowns();
    const modal = document.getElementById('customFontModal');
    if (modal) {
        modal.classList.add('open');
        document.getElementById('customFontName').value = '';
        document.getElementById('customFontUrl').value = '';
        document.getElementById('customFontStack').value = 'sans-serif';
        updateCustomFontPreview();
    }
}

function closeCustomFontModal() {
    const modal = document.getElementById('customFontModal');
    if (modal) modal.classList.remove('open');
}

function updateCustomFontPreview() {
    const name = document.getElementById('customFontName').value || 'Open Sans';
    const url = document.getElementById('customFontUrl').value;
    const fallback = document.getElementById('customFontStack').value;
    const preview = document.getElementById('customFontPreview');

    if (url && preview) {
        const link = document.createElement('link');
        link.href = url;
        link.rel = 'stylesheet';
        link.id = 'tempFontPreview';

        const oldLink = document.getElementById('tempFontPreview');
        if (oldLink) oldLink.remove();

        document.head.appendChild(link);

        setTimeout(() => {
            preview.style.fontFamily = `'${name}', ${fallback}`;
        }, 300);
    }
}

function addCustomFont() {
    const name = document.getElementById('customFontName').value.trim();
    const url = document.getElementById('customFontUrl').value.trim();
    const fallback = document.getElementById('customFontStack').value || 'sans-serif';

    if (!name) {
        toast('Bitte einen Schriftart-Namen eingeben', 'error');
        return;
    }

    const fontData = { name, url, fallback };
    customFonts.push(fontData);
    localStorage.setItem('blog_custom_fonts', JSON.stringify(customFonts));

    if (url) {
        const link = document.createElement('link');
        link.href = url;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    updateFontMenu();
    setFont(`'${name}', ${fallback}`);

    closeCustomFontModal();
    toast(`Schriftart "${name}" hinzugefügt`, 'success');
}

function updateFontMenu() {
    const menu = document.getElementById('fontMenu');
    if (!menu) return;

    menu.querySelectorAll('.custom-font-item').forEach(el => el.remove());

    if (customFonts.length > 0) {
        const divider = menu.querySelector('.dropdown-divider');
        if (divider) {
            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'dropdown-section-title custom-font-item';
            sectionTitle.textContent = 'Eigene Schriftarten';
            divider.before(sectionTitle);

            customFonts.forEach((font, index) => {
                const btn = document.createElement('button');
                btn.className = 'custom-font-item';
                btn.textContent = font.name;
                btn.style.fontFamily = `'${font.name}', ${font.fallback}`;
                btn.onclick = () => setFont(`'${font.name}', ${font.fallback}`);
                divider.before(btn);
            });
        }
    }
}

function loadCustomFonts() {
    customFonts.forEach(font => {
        if (font.url) {
            const link = document.createElement('link');
            link.href = font.url;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    });
    updateFontMenu();
}
