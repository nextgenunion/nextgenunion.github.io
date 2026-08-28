/* ============================================================
   NGU POST COMPOSER — all logic for tools/post-composer.html.

   Everything runs client-side in the browser. Nothing is sent
   anywhere. The only network calls are the two CDN <script> tags
   in the HTML (marked.js + Google Fonts) purely for a nicer
   preview — if those fail to load (no internet), blog-helpers.js's
   built-in fallback renderer keeps everything working.
   ============================================================ */

// ---------- Mongolian Cyrillic -> Latin, for URL-safe slugs ----------
const NGU_CYR_MAP = {
  а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'yo', ж:'j', з:'z',
  и:'i', й:'i', к:'k', л:'l', м:'m', н:'n', о:'o', ө:'u', п:'p',
  р:'r', с:'s', т:'t', у:'u', ү:'u', ф:'f', х:'h', ц:'ts', ч:'ch',
  ш:'sh', щ:'sh', ъ:'', ы:'i', ь:'', э:'e', ю:'yu', я:'ya'
};
function nguTransliterate(str){
  return str.toLowerCase().split('').map(ch => NGU_CYR_MAP.hasOwnProperty(ch) ? NGU_CYR_MAP[ch] : ch).join('');
}
function nguSlugify(str){
  const s = nguTransliterate(str || '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return s || 'post';
}

function nguTodayISO(){
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nguEscapeHtml(s){
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function nguEscapeAttr(s){
  return nguEscapeHtml(s).replace(/"/g, '&quot;');
}

// ---------- Image resize (canvas -> JPEG), keeps posts lightweight ----------
function nguResizeImage(file, maxWidth, quality){
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob); else reject(new Error('Зургийг боловсруулж чадсангүй.'));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Зургийг уншиж чадсангүй.')); };
    img.src = url;
  });
}

// ---------- Dependency-free ZIP writer (STORE / no compression) ----------
const NGU_CRC_TABLE = (() => {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();
function nguCrc32(bytes){
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ NGU_CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function nguBuildZip(files){
  // files: [{ name: 'folder/file.ext', data: Uint8Array }]
  const now = new Date();
  const dosTime = ((now.getHours() & 0x1F) << 11) | ((now.getMinutes() & 0x3F) << 5) | (Math.floor(now.getSeconds() / 2) & 0x1F);
  const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 0x7F) << 9) | (((now.getMonth() + 1) & 0xF) << 5) | (now.getDate() & 0x1F);

  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  files.forEach(f => {
    const nameBytes = new TextEncoder().encode(f.name);
    const data = f.data;
    const crc = nguCrc32(data);
    const size = data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    const ldv = new DataView(local.buffer);
    ldv.setUint32(0, 0x04034b50, true);
    ldv.setUint16(4, 20, true);
    ldv.setUint16(6, 0, true);
    ldv.setUint16(8, 0, true);
    ldv.setUint16(10, dosTime, true);
    ldv.setUint16(12, dosDate, true);
    ldv.setUint32(14, crc, true);
    ldv.setUint32(18, size, true);
    ldv.setUint32(22, size, true);
    ldv.setUint16(26, nameBytes.length, true);
    ldv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    localChunks.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(central.buffer);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 20, true);
    cdv.setUint16(6, 20, true);
    cdv.setUint16(8, 0, true);
    cdv.setUint16(10, 0, true);
    cdv.setUint16(12, dosTime, true);
    cdv.setUint16(14, dosDate, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, size, true);
    cdv.setUint32(24, size, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint16(30, 0, true);
    cdv.setUint16(32, 0, true);
    cdv.setUint16(34, 0, true);
    cdv.setUint16(36, 0, true);
    cdv.setUint32(38, 0, true);
    cdv.setUint32(42, offset, true);
    central.set(nameBytes, 46);

    centralChunks.push(central);
    offset += local.length + data.length;
  });

  const centralOffset = offset;
  const centralSize = centralChunks.reduce((s, p) => s + p.length, 0);

  const end = new Uint8Array(22);
  const edv = new DataView(end.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(8, files.length, true);
  edv.setUint16(10, files.length, true);
  edv.setUint32(12, centralSize, true);
  edv.setUint32(16, centralOffset, true);

  return new Blob([...localChunks, ...centralChunks, end], { type: 'application/zip' });
}
function nguDownloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ============================================================
// Tool state & wiring
// ============================================================
(function(){
  const $ = id => document.getElementById(id);

  const titleInput = $('titleInput');
  const slugInput = $('slugInput');
  const tagInput = $('tagInput');
  const dateInput = $('dateInput');
  const authorInput = $('authorInput');
  const excerptInput = $('excerptInput');
  const bodyEditor = $('bodyEditor');

  const coverInput = $('coverInput');
  const coverThumb = $('coverThumb');
  const coverLabel = $('coverLabel');
  const inlineImageInput = $('inlineImageInput');
  const galleryInput = $('galleryInput');
  const galleryList = $('galleryList');

  const errorBox = $('errorBox');
  const outputPanel = $('outputPanel');
  const outputFilename = $('outputFilename');
  const manifestSnippet = $('manifestSnippet');
  const previewContent = $('previewContent');

  let slugManuallyEdited = false;
  let coverBlob = null;
  let existingCoverPath = null; // set when importing a post whose cover wasn't replaced
  let inlineImageCounter = 0;
  const bodyImages = new Map(); // filename -> Blob
  const galleryImages = []; // [{ blob, filename, caption }]

  dateInput.value = nguTodayISO();

  function showError(msg){
    errorBox.textContent = msg;
    errorBox.classList.add('show');
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function clearError(){
    errorBox.classList.remove('show');
  }

  // ---------- Slug auto-fill ----------
  slugInput.addEventListener('input', () => { slugManuallyEdited = true; });
  titleInput.addEventListener('input', () => {
    if (!slugManuallyEdited) slugInput.value = nguSlugify(titleInput.value);
    updatePreview();
  });

  // ---------- Cover image ----------
  coverInput.addEventListener('change', async () => {
    const file = coverInput.files[0];
    if (!file) return;
    try {
      coverBlob = await nguResizeImage(file, 1400, 0.85);
      existingCoverPath = null; // fresh cover replaces any imported one
      const url = URL.createObjectURL(coverBlob);
      coverThumb.style.backgroundImage = `url(${url})`;
      coverThumb.textContent = '';
      coverLabel.innerHTML = `<strong>Зураг сонгогдлоо</strong>Солихыг хүсвэл дахин дарна уу`;
      updatePreview();
    } catch (err) {
      showError(err.message);
    }
  });

  // ---------- Body toolbar ----------
  function wrapSelection(before, after){
    const start = bodyEditor.selectionStart, end = bodyEditor.selectionEnd;
    const value = bodyEditor.value;
    const selected = value.slice(start, end) || 'текст';
    bodyEditor.value = value.slice(0, start) + before + selected + after + value.slice(end);
    bodyEditor.focus();
    bodyEditor.selectionStart = start + before.length;
    bodyEditor.selectionEnd = start + before.length + selected.length;
    updatePreview();
  }
  function insertAtCursor(text){
    const start = bodyEditor.selectionStart, end = bodyEditor.selectionEnd;
    const value = bodyEditor.value;
    bodyEditor.value = value.slice(0, start) + text + value.slice(end);
    const pos = start + text.length;
    bodyEditor.focus();
    bodyEditor.selectionStart = bodyEditor.selectionEnd = pos;
    updatePreview();
  }

  $('btnBold').addEventListener('click', () => wrapSelection('**', '**'));
  $('btnItalic').addEventListener('click', () => wrapSelection('*', '*'));
  $('btnH2').addEventListener('click', () => insertAtCursor('\n\n## Гарчиг\n\n'));
  $('btnList').addEventListener('click', () => insertAtCursor('\n\n- Зүйл нэг\n- Зүйл хоёр\n\n'));
  $('btnLink').addEventListener('click', () => {
    const url = prompt('Холбоосын хаяг (URL):', 'https://');
    if (!url) return;
    wrapSelection('[', `](${url})`);
  });
  $('btnImage').addEventListener('click', () => inlineImageInput.click());

  inlineImageInput.addEventListener('change', async () => {
    const file = inlineImageInput.files[0];
    if (!file) return;
    try {
      const caption = prompt('Зургийн тайлбар (заавал биш, хоосон орхиж болно):', '') || '';
      const blob = await nguResizeImage(file, 1100, 0.82);
      inlineImageCounter++;
      const filename = `image-${inlineImageCounter}.jpg`;
      bodyImages.set(filename, blob);
      const trimmedCap = caption.trim();
      const figure = trimmedCap
        ? `\n\n<figure><img src="images/${filename}" alt="${nguEscapeAttr(trimmedCap)}"><figcaption>${nguEscapeHtml(trimmedCap)}</figcaption></figure>\n\n`
        : `\n\n<figure><img src="images/${filename}" alt=""></figure>\n\n`;
      insertAtCursor(figure);
    } catch (err) {
      showError(err.message);
    } finally {
      inlineImageInput.value = '';
    }
  });

  // ---------- Gallery ----------
  let galleryCounter = 0;
  galleryInput.addEventListener('change', async () => {
    const files = Array.from(galleryInput.files);
    for (const file of files) {
      try {
        const blob = await nguResizeImage(file, 900, 0.8);
        galleryCounter++;
        const filename = `gallery-${galleryCounter}.jpg`;
        const item = { blob, filename, caption: '' };
        galleryImages.push(item);
        renderGalleryItem(item);
      } catch (err) {
        showError(err.message);
      }
    }
    galleryInput.value = '';
    updatePreview();
  });

  function renderGalleryItem(item){
    const row = document.createElement('div');
    row.className = 'gallery-item';
    const url = URL.createObjectURL(item.blob);
    row.innerHTML = `
      <img src="${url}" alt="">
      <input type="text" placeholder="Тайлбар (заавал биш)">
      <button type="button" title="Устгах">✕</button>
    `;
    row.querySelector('input').addEventListener('input', (e) => {
      item.caption = e.target.value;
      updatePreview();
    });
    row.querySelector('button').addEventListener('click', () => {
      const idx = galleryImages.indexOf(item);
      if (idx > -1) galleryImages.splice(idx, 1);
      row.remove();
      updatePreview();
    });
    galleryList.appendChild(row);
  }

  // ---------- Live preview ----------
  let previewTimer = null;
  function updatePreview(){
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 150);
  }
  function renderPreview(){
    const title = titleInput.value.trim();
    if (!title && !bodyEditor.value.trim() && !coverBlob) {
      previewContent.innerHTML = '<p class="preview-empty">Мэдээллээ бөглөхөд урьдчилан харагдац энд шинэчлэгдэнэ.</p>';
      return;
    }
    const coverUrl = coverBlob ? URL.createObjectURL(coverBlob) : null;
    const bodyHtml = nguRenderMarkdown(bodyEditor.value || '');
    previewContent.innerHTML = `
      ${coverUrl ? `<div class="post-cover"><img src="${coverUrl}" alt=""></div>` : ''}
      <div class="post-header">
        <span class="post-tag">${nguEscapeHtml(tagInput.value.trim() || 'Ангилал')}</span>
        <h1>${nguEscapeHtml(title || 'Гарчгийн жишээ')}</h1>
        <div class="post-meta">${nguFormatDate(dateInput.value || nguTodayISO())} · ${nguEscapeHtml(authorInput.value.trim() || 'NGU баг')}</div>
      </div>
      <div class="post-body">${bodyHtml}</div>
    `;
  }
  [tagInput, dateInput, authorInput, bodyEditor].forEach(el => el.addEventListener('input', updatePreview));

  // ---------- Import an existing content.js ----------
  $('importInput').addEventListener('change', async () => {
    const file = $('importInput').files[0];
    if (!file) return;
    const text = await file.text();
    let captured = null;
    try {
      const runner = new Function('NGU_REGISTER_POST', text);
      runner(post => { captured = post; });
    } catch (err) {
      showError('Файлыг уншиж чадсангүй: ' + err.message);
      return;
    }
    if (!captured) {
      showError('Энэ файлаас нийтлэлийн мэдээлэл олдсонгүй. content.js файл сонгосон эсэхээ шалгана уу.');
      return;
    }
    clearError();
    titleInput.value = captured.title || '';
    slugInput.value = captured.slug || '';
    slugManuallyEdited = true;
    tagInput.value = captured.tag || '';
    dateInput.value = captured.date || nguTodayISO();
    authorInput.value = captured.author || 'NGU баг';
    excerptInput.value = captured.excerpt || '';
    bodyEditor.value = captured.body || '';
    existingCoverPath = captured.cover || null;
    coverBlob = null;
    coverThumb.style.backgroundImage = '';
    coverThumb.textContent = '🖼️';
    coverLabel.innerHTML = existingCoverPath
      ? `<strong>Одоогийн зураг хадгалагдана</strong>${existingCoverPath} — солихыг хүсвэл шинэ зураг сонгоно уу`
      : `<strong>Зураг сонгох</strong>JPG, PNG, эсвэл WEBP`;
    updatePreview();
  });

  // ---------- Generate & download ----------
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Бүх талбарыг цэвэрлэх үү? Хадгалаагүй мэдээлэл устана.')) return;
    location.reload();
  });

  $('generateBtn').addEventListener('click', async () => {
    clearError();
    outputPanel.classList.remove('show');

    const slug = slugInput.value.trim();
    const title = titleInput.value.trim();

    if (!title) { showError('Гарчиг оруулна уу.'); return; }
    if (!slug) { showError('Slug хоосон байна.'); return; }
    if (!coverBlob && !existingCoverPath) { showError('Тэргүүлэх зураг (cover) сонгоно уу.'); return; }
    if (!bodyEditor.value.trim()) { showError('Нийтлэлийн бичвэр хоосон байна.'); return; }

    const files = [];
    const post = {
      slug,
      title,
      excerpt: excerptInput.value.trim() || title,
      date: dateInput.value || nguTodayISO(),
      tag: tagInput.value.trim() || 'Мэдээ',
      author: authorInput.value.trim() || 'NGU баг',
      cover: '',
      body: bodyEditor.value
    };

    if (coverBlob) {
      post.cover = `posts/${slug}/images/cover.jpg`;
      files.push({ name: `${slug}/images/cover.jpg`, data: new Uint8Array(await coverBlob.arrayBuffer()) });
    } else {
      post.cover = existingCoverPath;
    }

    for (const [filename, blob] of bodyImages.entries()) {
      files.push({ name: `${slug}/images/${filename}`, data: new Uint8Array(await blob.arrayBuffer()) });
    }

    if (galleryImages.length) {
      const figs = galleryImages.map(g => {
        const cap = g.caption.trim();
        return cap
          ? `<figure><img src="images/${g.filename}" alt="${nguEscapeAttr(cap)}"><figcaption>${nguEscapeHtml(cap)}</figcaption></figure>`
          : `<figure><img src="images/${g.filename}" alt=""></figure>`;
      }).join('\n');
      post.body += `\n\n## Зургийн цомог\n\n<div class="post-gallery">\n${figs}\n</div>`;
      for (const g of galleryImages) {
        files.push({ name: `${slug}/images/${g.filename}`, data: new Uint8Array(await g.blob.arrayBuffer()) });
      }
    }

    const contentJs = `// Auto-generated by NGU Post Composer — safe to hand-edit afterwards.\nNGU_REGISTER_POST(\n${JSON.stringify(post, null, 2)}\n);\n`;
    files.push({ name: `${slug}/content.js`, data: new TextEncoder().encode(contentJs) });

    const zipBlob = nguBuildZip(files);
    const zipName = `${slug}.zip`;
    nguDownloadBlob(zipBlob, zipName);

    outputFilename.textContent = zipName;
    manifestSnippet.textContent = `"${slug}",`;
    outputPanel.classList.add('show');
    outputPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  $('copyManifestBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(manifestSnippet.textContent).then(() => {
      const btn = $('copyManifestBtn');
      const original = btn.textContent;
      btn.textContent = 'Хуулагдлаа ✓';
      setTimeout(() => { btn.textContent = original; }, 1600);
    });
  });

  updatePreview();
})();
