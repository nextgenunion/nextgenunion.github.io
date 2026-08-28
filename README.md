# NGU — Next Gen Union website

A simple, modular site. No build tools, no server, no database. Open `index.html` in a browser, or upload the whole folder to any static host (Netlify, GitHub Pages, Vercel, etc.).

## Folder structure

```
ngu-site/
├── index.html                    ← homepage content & structure
├── css/style.css                  ← all design tokens: colors, fonts, spacing, animation
├── js/main.js                      ← behavior: scroll reveal, sticky nav, mobile menu
├── images/                        ← homepage photos (team, vision, mission, etc.)
│
├── blog/
│   ├── blog.html                    ← post listing page
│   ├── post.html                    ← single-post page (one template, reused for every post)
│   ├── posts-manifest.js            ← ★ the file that decides which posts are published
│   ├── blog-loader.js               ← loads each published post automatically — don't touch
│   ├── blog-helpers.js              ← rendering logic — don't touch
│   ├── blog.js / post.js            ← page-specific rendering — don't touch
│   ├── blog.css                     ← blog-only styles (cards, article typography, galleries)
│   └── posts/
│       ├── my-first-post/             ← ★ one folder per post — this is what you create
│       │   ├── content.js               ← the post's text + metadata
│       │   └── images/
│       │       ├── cover.jpg              ← headline image
│       │       ├── image-1.jpg            ← images placed inside the text
│       │       └── gallery-1.jpg          ← images in the bottom photo gallery
│       └── another-post/
│           └── ...
│
└── tools/
    └── post-composer.html         ← ★ open this in a browser to create/edit posts, no coding
```

## Editing the homepage

Open `index.html` in any text editor — each section is marked with a comment (`<!-- ============ MISSION ============ -->`). Edit the text between the tags. Colors and fonts are single-source variables at the top of `css/style.css`. Photos are plain files in `images/` — replace a file (same name) to swap a photo.

---

## Publishing a blog post — the easy way

**Open `tools/post-composer.html` in a browser** (just double-click it, no server or install needed). It's a point-and-click form:

1. Fill in the title, category, date, author, and a short excerpt.
2. Upload a headline (cover) image.
3. Write the post body. The toolbar above the text box lets you **bold**, *italic*, add headings, bullet lists, links, and — importantly — **insert a photo right in the middle of the text** at your cursor position (with an optional caption).
4. Optionally add a row of photos to a gallery at the bottom of the post.
5. Watch the live preview on the right update as you type — it looks exactly like the real site.
6. Click **"ZIP татах"**. This downloads a ready-made folder (zipped) containing everything the post needs: its text and every image, already resized and compressed for the web.
7. Unzip it, drag the resulting folder into `blog/posts/`, then open `blog/posts-manifest.js` and paste in the one line the tool showed you.
8. Save, refresh the site — the post is live.

That's the whole workflow. No code is touched except pasting one line into a list.

**Editing an existing post:** in the composer, use "Одоо байгаа нийтлэлийг засах" at the top and pick that post's `content.js` file — every field prefills, including the body text. Change whatever you like and generate again. If you don't upload a new cover image, the existing one is kept automatically.

Everything in the tool runs locally in your browser — nothing is uploaded anywhere.

---

## How the blog actually works (for reference / troubleshooting)

Each post is a self-contained **folder** under `blog/posts/<slug>/`:
- `content.js` — a small file that registers the post's title, date, tag, excerpt, cover image path, and body text (in Markdown).
- `images/` — every image that post uses, all together in one place.

For a post to actually show up on the site, its folder name (its "slug") has to be listed in **`blog/posts-manifest.js`**. This is the one file that controls what's published — think of it as the on/off switch:

- **Publish** a post → add its slug to the list.
- **Unpublish** (hide, but keep the files) → remove its slug from the list.
- **Permanently delete** → remove the slug *and* delete the folder.

Posts are always shown newest-first automatically (by their `date` field) — you never need to reorder anything.

### Writing a post body by hand (if you skip the tool)

The `body` field is plain Markdown:
- A blank line starts a new paragraph.
- `## Heading text` makes a subheading.
- `- item` makes a bullet list.
- `**bold**` and `[link text](https://example.com)` work as expected.
- An image in the middle of the text: `![alt text](images/photo.jpg)`, or for a captioned image:
  `<figure><img src="images/photo.jpg" alt="..."><figcaption>Caption here</figcaption></figure>`
- A bottom photo gallery: wrap several of those `<figure>` blocks in `<div class="post-gallery">...</div>`.

The Post Composer generates all of this for you automatically — hand-editing is only needed for advanced tweaks.

### Why folders + a manifest, instead of a database?

This site has no backend (no server, no database, no login) — that's what makes it free to host anywhere and impossible to "break" from the outside. The tradeoff is that "publishing" means adding files and one line of text instead of clicking Publish in an admin panel. The Composer tool removes the folder/coding part of that; the one remaining step (pasting a line into the manifest) keeps things simple and dependency-free.

If the team grows and even that one step becomes a bottleneck, the real next step would be a Git-based CMS (e.g. Decap CMS) or a proper headless backend — that requires choosing a git-based host (like GitHub Pages or Netlify) and some setup, so it's worth revisiting only if this workflow genuinely becomes a pain point.

---

## Notes

- The "Бидэнтэй холбогдох" (contact) buttons currently link to the `#contact` section on the homepage. Once you have a real contact channel (email, form, Instagram), update the `href` on those buttons across `index.html`, `blog/blog.html`, and `blog/post.html`.
- The site respects `prefers-reduced-motion` and is responsive from desktop down to small phones.
- Blog pages and the Composer tool pull in [marked.js](https://marked.js.org/) from a CDN for richer Markdown rendering; if that ever fails to load (no internet), a built-in fallback still handles paragraphs, headings, bold text, links, images, and bullet lists.
