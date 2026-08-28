/* ============================================================
   POST MANIFEST — the ONE file to edit to publish or unpublish
   a post (once its folder already exists inside blog/posts/).

   The NGU Post Composer tool (tools/post-composer.html) tells
   you exactly what line to add here after you generate a post,
   so in normal use you just copy-paste what it shows you.

   HOW IT WORKS: each blog post lives in its own folder under
   blog/posts/ — e.g. blog/posts/my-post-slug/content.js plus
   blog/posts/my-post-slug/images/. Listing the folder name
   ("slug") here is what makes the site actually load and show
   that post. Order doesn't matter — posts are always displayed
   newest-first by their own date.

   TO PUBLISH A POST: add its slug to the array below.
   TO UNPUBLISH A POST: remove its slug from the array below
     (this just hides it — the folder and its files are untouched,
     so you can re-publish it later by adding the slug back).
   TO PERMANENTLY DELETE A POST: remove the slug here AND delete
     its folder from blog/posts/.
   ============================================================ */
const NGU_POST_SLUGS = [
  "ngu-uusgen-baiguulah-tsuglaan",
  "gishuunchleliin-hutulbur-ehellee",
  "oiryn-tuluvlugu-mini-olimp-lig"
];
