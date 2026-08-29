// Project Composer — add, edit, delete, and reorder cards for the
// "Projects / Төслүүд" section without hand-editing projects-data.js.
// Loads the current NGU_PROJECTS array (from projects/projects-data.js,
// included before this script) as the starting point.

(function(){
  function $(id){ return document.getElementById(id); }

  function escapeHtml(s){
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));
  }

  // Working copy — never mutate NGU_PROJECTS directly.
  const projects = (typeof NGU_PROJECTS !== 'undefined')
    ? JSON.parse(JSON.stringify(NGU_PROJECTS))
    : [];

  let editingIndex = -1; // -1 = adding a new project, otherwise index being edited

  const plist = $('plist');
  const previewGrid = $('previewGrid');
  const errorBox = $('errorBox');
  const editingBadge = $('editingBadge');
  const editingName = $('editingName');
  const cancelEditBtn = $('cancelEditBtn');
  const saveBtn = $('saveBtn');

  const iconInput = $('iconInput');
  const titleInput = $('titleInput');
  const tagInput = $('tagInput');
  const descInput = $('descInput');
  const urlInput = $('urlInput');

  function showError(msg){
    errorBox.textContent = msg;
    errorBox.classList.add('show');
  }
  function clearError(){
    errorBox.textContent = '';
    errorBox.classList.remove('show');
  }

  function clearForm(){
    iconInput.value = '';
    titleInput.value = '';
    tagInput.value = '';
    descInput.value = '';
    urlInput.value = '';
  }

  function startEdit(i){
    const p = projects[i];
    if (!p) return;
    editingIndex = i;
    iconInput.value = p.icon || '';
    titleInput.value = p.title || '';
    tagInput.value = p.tag || '';
    descInput.value = p.description || '';
    urlInput.value = p.url || '';
    editingBadge.classList.add('show');
    editingName.textContent = p.title || '';
    cancelEditBtn.style.display = '';
    saveBtn.textContent = 'Өөрчлөлтийг хадгалах →';
    clearError();
    iconInput.scrollIntoView({ behavior:'smooth', block:'center' });
  }

  function cancelEdit(){
    editingIndex = -1;
    clearForm();
    editingBadge.classList.remove('show');
    cancelEditBtn.style.display = 'none';
    saveBtn.textContent = 'Жагсаалтад нэмэх →';
    clearError();
  }

  function moveProject(i, dir){
    const j = i + dir;
    if (j < 0 || j >= projects.length) return;
    [projects[i], projects[j]] = [projects[j], projects[i]];
    if (editingIndex === i) editingIndex = j;
    else if (editingIndex === j) editingIndex = i;
    renderAll();
  }

  function deleteProject(i){
    if (!confirm('Энэ төслийг жагсаалтаас устгах уу?')) return;
    projects.splice(i, 1);
    if (editingIndex === i) cancelEdit();
    else if (editingIndex > i) editingIndex--;
    renderAll();
  }

  function projectCardHTML(p){
    return `
      <a class="project-card reveal in" href="${escapeHtml(p.url || '#')}" target="_blank" rel="noopener">
        <div class="project-icon">${escapeHtml(p.icon || '🔗')}</div>
        <div class="project-card-body">
          <span class="project-tag">${escapeHtml(p.tag || '')}</span>
          <h3>${escapeHtml(p.title || '')}</h3>
          <p>${escapeHtml(p.description || '')}</p>
          <span class="project-link">Нээх &nbsp;↗</span>
        </div>
      </a>`;
  }

  function renderList(){
    if (!projects.length){
      plist.innerHTML = '<p class="plist-empty">Одоогоор төсөл алга байна. Доор эхнийхээ нэмнэ үү.</p>';
      return;
    }
    plist.innerHTML = projects.map((p, i) => `
      <div class="plist-item">
        <div class="picon">${escapeHtml(p.icon || '🔗')}</div>
        <div class="pinfo">
          <strong>${escapeHtml(p.title || '(нэргүй)')}</strong>
          <span>${escapeHtml(p.url || '')}</span>
        </div>
        <div class="pactions">
          <button type="button" data-act="up" data-i="${i}" title="Дээш" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-act="down" data-i="${i}" title="Доош" ${i === projects.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-act="edit" data-i="${i}" title="Засах">✎</button>
          <button type="button" data-act="delete" data-i="${i}" class="danger" title="Устгах">🗑</button>
        </div>
      </div>
    `).join('');
  }

  function renderPreview(){
    previewGrid.innerHTML = projects.length
      ? projects.map(projectCardHTML).join('')
      : '<p class="preview-empty">Жагсаалт хоосон байна.</p>';
  }

  function renderAll(){
    renderList();
    renderPreview();
  }

  plist.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const i = parseInt(btn.dataset.i, 10);
    const act = btn.dataset.act;
    if (act === 'up') moveProject(i, -1);
    else if (act === 'down') moveProject(i, 1);
    else if (act === 'edit') startEdit(i);
    else if (act === 'delete') deleteProject(i);
  });

  cancelEditBtn.addEventListener('click', cancelEdit);

  saveBtn.addEventListener('click', () => {
    clearError();
    const title = titleInput.value.trim();
    const tag = tagInput.value.trim();
    const description = descInput.value.trim();
    const url = urlInput.value.trim();
    const icon = iconInput.value.trim();

    if (!title) return showError('Гарчиг оруулна уу.');
    if (!url) return showError('Холбоос (URL) оруулна уу.');
    if (!/^https?:\/\//i.test(url)) return showError('Холбоос "http://" эсвэл "https://"-ээр эхлэх ёстой.');

    const entry = { title, tag, description, url, icon: icon || '🔗' };

    if (editingIndex === -1){
      projects.push(entry);
    } else {
      projects[editingIndex] = entry;
    }
    cancelEdit();
    renderAll();
  });

  $('generateBtn').addEventListener('click', () => {
    const header = `/* ============================================================
   PROJECTS — the file to edit to add, remove, or update a project
   card. Unlike blog posts, a project is just a link card pointing
   to an external site — no folder, no images, no manifest needed.
   Add or remove entries in the array below and save.

   Fields:
     title       — project name shown on the card
     tag         — short label above the title (e.g. category)
     description — one or two sentences
     url         — the external site this card links to
     icon        — one emoji shown next to the title
   ============================================================ */
`;
    const body = `const NGU_PROJECTS = ${JSON.stringify(projects, null, 2)};\n`;
    const content = header + body;

    const blob = new Blob([content], { type: 'application/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'projects-data.js';
    document.body.appendChild(a);
    a.click();
    a.remove();

    $('outputPanel').classList.add('show');
    $('outputPanel').scrollIntoView({ behavior:'smooth', block:'nearest' });
  });

  renderAll();
})();
