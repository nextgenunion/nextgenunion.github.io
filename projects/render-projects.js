// Renders every entry from projects-data.js into any element with
// id="projectsGrid" on the current page (used on both the homepage
// teaser and projects/projects.html). Runs immediately — unlike the
// blog, project data is a single small file with no per-project
// loading, so there's no "ready" event to wait for.
(function(){
  function projectCardHTML(p){
    return `
      <a class="project-card reveal in" href="${p.url}" target="_blank" rel="noopener">
        <div class="project-icon">${p.icon || '🔗'}</div>
        <div class="project-card-body">
          <span class="project-tag">${p.tag}</span>
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          <span class="project-link">Нээх &nbsp;↗</span>
        </div>
      </a>`;
  }

  document.querySelectorAll('#projectsGrid').forEach(grid => {
    grid.innerHTML = (typeof NGU_PROJECTS !== 'undefined' && NGU_PROJECTS.length)
      ? NGU_PROJECTS.map(projectCardHTML).join('')
      : '<p class="post-empty">Одоогоор төсөл алга байна.</p>';
  });
})();
