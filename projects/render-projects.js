// Renders every entry from projects-data.js into any element with
// id="projectsGrid" on the current page (used on both the homepage
// teaser and projects/projects.html). Runs immediately — unlike the
// blog, project data is a single small file with no per-project
// loading, so there's no "ready" event to wait for.
(function(){
  // Simple line icons. In projects-data.js set icon to one of these names,
  // or to any single emoji / short text, which is shown as it is.
  const ICONS = {
    music: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 24V7l14-3v17"/><circle cx="8.5" cy="24" r="3.5"/><circle cx="22.5" cy="21" r="3.5"/></svg>',
    link:  '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M14 18a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M18 14a5 5 0 0 0-7 0l-4 4a5 5 0 0 0 7 7l1.5-1.5"/></svg>'
  };

  function projectCardHTML(p){
    return `
      <a class="project-card" href="${p.url}" target="_blank" rel="noopener">
        <div class="project-icon">${ICONS[p.icon] || p.icon || ICONS.link}</div>
        <div class="project-card-body">
          <span class="project-tag">${p.tag}</span>
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          <span class="project-link">Нээх</span>
        </div>
      </a>`;
  }

  document.querySelectorAll('#projectsGrid').forEach(grid => {
    grid.innerHTML = (typeof NGU_PROJECTS !== 'undefined' && NGU_PROJECTS.length)
      ? NGU_PROJECTS.map(projectCardHTML).join('')
      : '<p class="post-empty">Одоогоор төсөл алга байна.</p>';
  });

  // The "all projects" button only makes sense once there is more than one
  const more = document.getElementById('projectsMore');
  if (more) more.hidden = !(typeof NGU_PROJECTS !== 'undefined' && NGU_PROJECTS.length > 1);
})();
