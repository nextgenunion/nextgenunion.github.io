// Show posts as their small content files arrive instead of leaving the
// listing blank until every post has finished loading.
function renderBlogGrid(){
  const grid = document.getElementById('blogGrid');
  if (!grid) return;

  const posts = nguSortedPosts();
  if (posts.length){
    grid.innerHTML = posts.map(post => nguPostCardHTML(post, '')).join('');
    grid.setAttribute('aria-busy', window.NGU_POSTS_READY ? 'false' : 'true');
  } else if (window.NGU_POSTS_READY){
    grid.innerHTML = '<p class="post-empty">Одоогоор нийтлэл алга байна.</p>';
    grid.setAttribute('aria-busy', 'false');
  }
}

document.addEventListener('ngu:post-added', renderBlogGrid);
document.addEventListener('ngu:posts-ready', renderBlogGrid);
renderBlogGrid();
