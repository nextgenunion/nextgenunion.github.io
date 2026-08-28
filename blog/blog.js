// Renders every registered post into the #blogGrid container, newest
// first. Waits for "ngu:posts-ready" (fired by blog-loader.js once
// every post folder listed in posts-manifest.js has loaded).
document.addEventListener('ngu:posts-ready', function(){
  const grid = document.getElementById('blogGrid');
  if (!grid) return;

  const posts = nguSortedPosts();

  grid.innerHTML = posts.length
    ? posts.map(post => nguPostCardHTML(post, '')).join('')
    : '<p class="post-empty">Одоогоор нийтлэл алга байна.</p>';
});
