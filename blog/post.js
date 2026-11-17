// Render the requested article as soon as its content file arrives. The
// neighbouring-post links are added once the full manifest has loaded.
(function(){
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const root = document.getElementById('postRoot');
  const navWrap = document.getElementById('postNav');
  if (!root || !navWrap) return;

  let renderedPost = null;

  function showNotFound(){
    if (renderedPost) return;
    root.innerHTML = `
      <div class="post-header post-not-found">
        <h1>Нийтлэл олдсонгүй</h1>
        <p>Хайж буй нийтлэл устгагдсан, нийтлэгдээгүй, эсвэл хаяг буруу байна.</p>
        <a href="blog.html" class="btn btn-sun">Бүх нийтлэл рүү буцах</a>
      </div>`;
    root.setAttribute('aria-busy', 'false');
    document.title = 'Нийтлэл олдсонгүй — NGU';
  }

  function renderPost(post){
    if (!post || post.slug !== slug) return;
    renderedPost = post;
    document.title = post.title + ' — NGU';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', post.excerpt);

    root.innerHTML = `
      <header class="post-header">
        <h1>${post.title}</h1>
        <div class="post-meta">${nguPostMetaHTML(post)}</div>
      </header>
      <div class="post-cover"><img src="${post.cover}" alt="${post.title}" fetchpriority="high"></div>
      <div class="post-body">${nguRenderMarkdown(post.body)}</div>
    `;
    root.setAttribute('aria-busy', 'false');

    // Posters and other tall images should be shown whole, not cropped.
    const coverImg = root.querySelector('.post-cover img');
    if (coverImg) {
      const check = () => {
        if (coverImg.naturalHeight > coverImg.naturalWidth * 1.1) {
          coverImg.parentElement.classList.add('is-portrait');
        }
      };
      if (coverImg.complete) check(); else coverImg.addEventListener('load', check);
    }
  }

  function renderPostNav(){
    if (!renderedPost || !window.NGU_POSTS_READY) return;
    const posts = nguSortedPosts();
    const index = posts.findIndex(post => post.slug === renderedPost.slug);
    if (index < 0) return;

    const previous = posts[index + 1];
    const next = posts[index - 1];
    const links = [];
    if (previous) {
      links.push(`<a class="post-nav-card previous" href="post.html?slug=${encodeURIComponent(previous.slug)}" aria-label="Өмнөх нийтлэл: ${previous.title}">
        <span class="post-nav-label">← Өмнөх нийтлэл</span>
        <span class="post-nav-title">${previous.title}</span>
      </a>`);
    }
    if (next) {
      links.push(`<a class="post-nav-card next" href="post.html?slug=${encodeURIComponent(next.slug)}" aria-label="Дараагийн нийтлэл: ${next.title}">
        <span class="post-nav-label">Дараагийн нийтлэл →</span>
        <span class="post-nav-title">${next.title}</span>
      </a>`);
    }

    navWrap.innerHTML = links.join('');
    navWrap.hidden = links.length === 0;
  }

  document.addEventListener('ngu:post-added', function(event){
    if (event.detail && event.detail.slug === slug) renderPost(event.detail);
    renderPostNav();
  });
  document.addEventListener('ngu:posts-ready', function(){
    if (!renderedPost) renderPost(nguSortedPosts().find(post => post.slug === slug));
    if (!renderedPost) showNotFound();
    renderPostNav();
  });

  // Handles cached scripts that finished before these listeners were bound.
  renderPost(nguSortedPosts().find(post => post.slug === slug));
  if (window.NGU_POSTS_READY && !renderedPost) showNotFound();
  renderPostNav();
})();
