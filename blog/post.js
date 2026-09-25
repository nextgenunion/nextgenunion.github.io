// Reads ?slug=... from the URL, finds the matching post (once
// "ngu:posts-ready" fires), and renders it, plus prev/next links.
document.addEventListener('ngu:posts-ready', function(){
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const posts = nguSortedPosts();
  const index = posts.findIndex(p => p.slug === slug);
  const post = index >= 0 ? posts[index] : null;

  const root = document.getElementById('postRoot');
  if (!root) return;

  if (!post) {
    root.innerHTML = `
      <div class="post-header" style="text-align:center;">
        <h1>Нийтлэл олдсонгүй</h1>
        <p style="margin-top:16px;color:var(--mist-dim);">Хайж буй нийтлэл устгагдсан, нийтлэгдээгүй, эсвэл хаяг буруу байна.</p>
        <a href="blog.html" class="btn btn-primary" style="margin-top:28px;display:inline-flex;">Бүх нийтлэл рүү буцах</a>
      </div>`;
    document.title = 'Нийтлэл олдсонгүй — NGU';
    return;
  }

  document.title = post.title + ' — NGU';

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', post.excerpt);

  root.innerHTML = `
    ${post.cover ? `<div class="post-cover"><img src="${post.cover}" alt="${post.title}"></div>` : ""}
    <div class="post-header">
      <span class="post-tag">${post.tag}</span>
      <h1>${post.title}</h1>
      <div class="post-meta">${nguFormatDate(post.date)} · ${post.author}</div>
    </div>
    <div class="post-body">${nguRenderMarkdown(post.body)}</div>
  `;

  const prev = posts[index + 1]; // older
  const next = posts[index - 1]; // newer
  const navWrap = document.getElementById('postNav');
  if (navWrap) {
    navWrap.innerHTML = `
      ${prev ? `<a href="post.html?slug=${encodeURIComponent(prev.slug)}" class="post-back">&larr; ${prev.title}</a>` : '<span></span>'}
      ${next ? `<a href="post.html?slug=${encodeURIComponent(next.slug)}" class="post-back">${next.title} &rarr;</a>` : '<span></span>'}
    `;
  }
});
