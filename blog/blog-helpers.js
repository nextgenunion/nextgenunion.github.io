/* ============================================================
   BLOG HELPERS — shared by blog/blog.js, blog/post.js, and the
   homepage "latest posts" teaser.

   window.NGU_POSTS is populated by each post's content.js file
   calling NGU_REGISTER_POST({...}) — see blog/blog-loader.js for
   how those files get loaded.
   ============================================================ */

window.NGU_POSTS = window.NGU_POSTS || [];

/** Called by each blog/posts/<slug>/content.js file. */
function NGU_REGISTER_POST(post){
  window.NGU_POSTS.push(post);
}

/** Posts sorted newest first. */
function nguSortedPosts(){
  return [...window.NGU_POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));
}

/** "2026-03-01" -> "2026 оны 3-р сарын 1" */
function nguFormatDate(iso){
  const months = ['1-р','2-р','3-р','4-р','5-р','6-р','7-р','8-р','9-р','10-р','11-р','12-р'];
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return `${d.getFullYear()} оны ${months[d.getMonth()]} сарын ${d.getDate()}`;
}

/**
 * Minimal Markdown -> HTML fallback, used only if the marked.js CDN
 * script fails to load (e.g. no internet connection). Supports
 * paragraphs, "## " headings, "- " bullet lists, **bold**,
 * [text](url) links, ![alt](src) images, and passes raw HTML
 * blocks (like the <figure> blocks the Post Composer generates for
 * captioned images) straight through unwrapped.
 */
function nguRenderMarkdown(md){
  if (window.marked && typeof window.marked.parse === 'function') {
    return window.marked.parse(md);
  }
  const blocks = md.trim().split(/\n\s*\n/);
  return blocks.map(block => {
    const trimmed = block.trim();

    // Raw HTML block (e.g. <figure>...</figure> or <div>...</div>) —
    // pass through as-is, don't wrap in <p>.
    if (trimmed.startsWith('<')) {
      return trimmed;
    }

    const lines = trimmed.split('\n');
    if (lines[0].startsWith('## ')) {
      return `<h2>${nguInlineMarkdown(lines[0].slice(3))}</h2>`;
    }
    if (lines.every(l => l.trim().startsWith('- '))) {
      const items = lines.map(l => `<li>${nguInlineMarkdown(l.trim().slice(2))}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${nguInlineMarkdown(block).replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}

/** Inline-level Markdown used by the fallback above: bold, links, images. */
function nguInlineMarkdown(text){
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Builds one post card's HTML.
 * basePath is window.NGU_BLOG_BASE — "" when rendering from inside
 * blog/ (blog.html), or "blog/" when rendering from the homepage.
 * Every path in `post` (cover, links inside body) is stored relative
 * to blog/, so basePath is simply prepended.
 */
function nguPostCardHTML(post, basePath){
  basePath = basePath || '';
  return `
    <a class="post-card reveal in" href="${basePath}post.html?slug=${encodeURIComponent(post.slug)}">
      <div class="post-card-photo">${post.cover ? `<img src="${basePath}${post.cover}" alt="${post.title}" loading="lazy">` : `<div class="post-card-placeholder" aria-hidden="true">NGU</div>`}</div>
      <div class="post-card-body">
        <span class="post-tag">${post.tag}</span>
        <h3>${post.title}</h3>
        <p>${post.excerpt}</p>
        <div class="post-meta">${nguFormatDate(post.date)} · ${post.author}</div>
      </div>
    </a>`;
}
