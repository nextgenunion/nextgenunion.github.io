/* ============================================================
   BLOG LOADER — loads each post's content.js (per the slugs in
   posts-manifest.js), then fires a "ngu:posts-ready" event on
   `document` once they've all loaded (or failed — one broken
   post folder won't block the rest of the site).

   Pages using this must set `window.NGU_BLOG_BASE` BEFORE this
   script runs: "" if the page lives inside blog/ (blog.html,
   post.html), or "blog/" if the page lives at the site root
   (index.html). This is also reused by nguPostCardHTML() in
   blog-helpers.js so image/link paths resolve correctly from
   either location.
   ============================================================ */
(function(){
  var base = window.NGU_BLOG_BASE || '';
  var slugs = (typeof NGU_POST_SLUGS !== 'undefined') ? NGU_POST_SLUGS : [];

  function ready(){
    document.dispatchEvent(new Event('ngu:posts-ready'));
  }

  if (slugs.length === 0) {
    ready();
    return;
  }

  var remaining = slugs.length;
  function oneDone(){
    remaining--;
    if (remaining <= 0) ready();
  }

  slugs.forEach(function(slug){
    var s = document.createElement('script');
    s.src = base + 'posts/' + slug + '/content.js';
    s.onload = oneDone;
    s.onerror = function(){
      console.warn('NGU blog: could not load post "' + slug + '" — check that blog/posts/' + slug + '/content.js exists.');
      oneDone();
    };
    document.head.appendChild(s);
  });
})();
