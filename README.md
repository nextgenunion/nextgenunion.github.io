# NGU — Next Gen Union website

A simple, modular site. No build tools, no server, no database. Open `index.html` in a browser, or upload the whole folder to any static host (Netlify, GitHub Pages, Vercel, etc.).

## Folder structure

```
ngu-site/
├── index.html                    ← homepage content & structure
├── contact.html                   ← "Холбоо барих" page (Facebook, Instagram, YouTube, email, phone)
├── offline.html                   ← page shown instead of the browser's offline page (see "Offline page" below)
├── sw-root.js                     ← the small worker that does that; don't edit unless you add an app folder
├── css/tokens.css                 ← ★ colors + fonts (change the whole look here)
├── css/style.css                  ← page layout and sections
├── css/cards.css                  ← blog + project card styles
├── css/tools.css                  ← dark styling for the composer tools only
├── fonts/                         ← Rubik + Caveat (self-hosted, include Ү and Ө)
├── js/main.js                      ← mobile menu + draggable hero photos
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

## Offline page

`sw-root.js` (registered by `js/main.js` on every page) does two things, and nothing else:

1. When someone is offline and opens a page of this site, they see `offline.html` (in the site's own look) instead of Chrome's plain offline page. This only works for people who have visited the site once on that device, because the browser has to save the page first.
2. It makes the app addresses **without a trailing slash** (`nextgenunion.github.io/ngworship`) open the saved app when offline. Those addresses are outside the app's own offline scope, so without this Chrome shows its own offline page even though the app is saved.

Things to know:

- **New app folder** on this site? Add its path to `APP_PATHS` at the top of `sw-root.js`.
- **Changed `offline.html` or the Rubik fonts?** Change `CACHE` in `sw-root.js` (`ngu-site-v1` → `ngu-site-v2`), otherwise visitors keep the old saved copy.
- It needs the site at the **root** of its address (as on `nextgenunion.github.io`) and https; on other hosting the page simply behaves as before.
- To remove it: delete `sw-root.js` and `offline.html` and the "3. Offline support" block at the end of `js/main.js`. Visitors who already have it keep it until they clear site data, so replace `sw-root.js` with a file containing only `self.registration.unregister();` for a while first.

## Editing the homepage

Open `index.html` in any text editor — each section is marked with a comment (`<!-- ============ MISSION ============ -->`). Edit the text between the tags. Colors and fonts are single-source variables in `css/tokens.css`. Photos are plain files in `images/` — replace a file (same name) to swap a photo.

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

- The "Бидэнтэй холбогдох" nav buttons link to `contact.html`. Right now it shows only the real Facebook page (`facebook.com/nextgenerationunion`) and a line saying Instagram, YouTube, email and phone are coming. The page's old placeholder email, phone and example.com links were removed in v19. When real details exist, open `contact.html`; the comment inside the page shows what to paste.
- The homepage's bottom panel has two buttons: "NGU-д нэгдэх" → the Facebook page (opens in a new tab, marked with ↗) and "Холбоо барих" → `contact.html`.
- The site respects `prefers-reduced-motion` and is responsive from desktop down to small phones.
- Blog pages and the Composer tool pull in [marked.js](https://marked.js.org/) from a CDN for richer Markdown rendering; if that ever fails to load (no internet), a built-in fallback still handles paragraphs, headings, bold text, links, images, and bullet lists.

## Design notes (v12, updated v19)

- Look: a youth-group bulletin board. Photos are taped polaroids, buttons and cards are outlined stickers with a flat offset shadow, sections are colored sheets that stack as you scroll.
- Palette (in `css/tokens.css`): `--blue` #2B3AFF, `--sun` #FFD43B, `--pink` #FF7EB6, `--mint` #8CF0C6, `--navy` #0E1038, `--chalk` #F2F1FF.
- Fonts: Rubik for everything, Caveat for handwritten captions. Both cover Mongolian Ү/Ө. Pick any replacement with the same coverage.
- The hero photos can be dragged (mouse, touch, or arrow keys when focused). See `js/main.js`.
- The homepage ticker repeats the five directions. Words are in `index.html`, search for `ticker-set` (two identical copies; edit both).
- The five directions are a numbered list (`dir-row`). The "Жишээ" links point at real posts by their folder name (slug); change them if posts are renamed.
- On a phone, a quick swipe over the hero photos scrolls the page; hold a photo for a moment to drag it.
- A post can set `"coverPosition": "50% 0%"` in `content.js` to choose which part of its cover shows on the cards. Tall covers (posters) are shown whole on the post page.
- Keep post cover images under about 300 KB (JPG, about 1600 px wide). The Post Composer already does this.
