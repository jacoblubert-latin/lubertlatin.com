# Jacob Lubert Latin Tutoring — website

The site for **lubertlatin.com**. Plain HTML, CSS, and a few lines of JavaScript. No framework, no build step, no server. Hosted on Netlify.

- **Live site:** https://lubertlatin.com
- **Booking link used everywhere:** https://cal.com/jacob-lubert-latin
- **Deployment and domain setup:** see [DEPLOY.md](DEPLOY.md)

## What's in here

```
site/                 ← everything Netlify publishes
  index.html          ← the home page (all the text lives here)
  free-sheet.html     ← "thank you" page after the PDF signup (has the download link)
  thank-you.html      ← "thank you" page after the contact form
  404.html            ← page-not-found
  css/styles.css      ← colors, fonts, layout
  css/fonts.css       ← self-hosted font files (don't edit)
  js/main.js          ← mobile menu, footer year, FAQ search markup
  assets/             ← images, fonts, and the PDF
  robots.txt, sitemap.xml
netlify.toml          ← Netlify settings
tools/                ← sources for the PDF and images (see below)
```

## Editing text and pricing (no coding needed)

Open `site/index.html` in any text editor (Notepad works; VS Code is nicer). Everything on the page is plain text between tags. Change the words, save, and push (see "Publishing a change" below). Nothing else is required.

Look for comments that start with `✏️` — they mark the spots people edit most.

### Prices

Find the `<!-- ✏️ EDIT PRICING -->` comment. Each price is on one line:

```html
<p class="price"><span class="from">from</span> $100 <span class="per">/ hour</span></p>
```

Change `$100` to the new number. Same for `$35`. To change "Ask for dates" on the intensives card, edit that text where it appears.

### FAQ

Find the `<!-- ✏️ EDIT FAQ -->` comment. Each question looks like this:

```html
<details>
  <summary>How does scheduling work?</summary>      ← the question
  <div class="answer">
    <p>You choose a time on my online calendar...</p>   ← the answer
  </div>
</details>
```

Copy a whole `<details>...</details>` block to add a question; delete one to remove it. The search-engine FAQ markup updates itself.

### About paragraph, headline, cards

Just edit the words. Keep the tags (`<p>`, `<h2>`, etc.) around them.

### Special characters

Use `&amp;` for an ampersand in text (e.g. `AP Latin &amp; NLE`). Curly quotes and the en dash (–) can be typed directly.

### Your photo

To change it, replace `site/assets/jacob-lubert.jpg` with a new file of the same name (portrait orientation, about 1000×1250 px; under 200 KB is ideal — [squoosh.app](https://squoosh.app) can shrink it). If the new photo has a different shape, update the `width` and `height` numbers on the `<img>` next to the `<!-- ✏️ PHOTO -->` comment in `index.html` to match.

### Testimonials

The "What families say" section (between **Pricing** and **About**) holds one quote in a `<blockquote>` with the names in `<cite>`. To add another, copy the whole `<figure class="hero-quote testimonial-quote">...</figure>` block (marked with a `✏️ TESTIMONIALS` comment) and paste it below the first.

### Colors and fonts

Open `site/css/styles.css`. The first block (`:root`) holds the colors. Change `--accent` to recolor every button and heading accent.

## Publishing a change

Netlify redeploys automatically whenever you push to the `main` branch on GitHub. From the project folder:

```bash
git add -A
```
```bash
git commit -m "Update pricing"
```
```bash
git push
```

The live site updates in about a minute. You can also edit files directly on GitHub.com (pencil icon → edit → "Commit changes") and skip the command line entirely.

## Form submissions

Both forms (contact and PDF signup) are handled by **Netlify Forms**. Submissions appear in the Netlify dashboard under **Forms**, and you can turn on email notifications there (Forms → Settings → Form notifications). The free plan includes 100 submissions a month.

The PDF signup redirects to `free-sheet.html`, which has the download link. No email is sent; if you later want the PDF emailed automatically, connect the form to Zapier/Make or a mailing-list service.

## Updating the free PDF

The PDF is generated from `tools/id-sheet.html`. Edit that file, then run from the project folder:

```bash
powershell -ExecutionPolicy Bypass -File tools\build-assets.ps1
```

This rebuilds the PDF (and the social-sharing image from `tools/og-image.html`) using Chrome or Edge. Commit and push the result.

## Checking the site locally

Any static file server works. With Node installed:

```bash
npx serve site
```

Then open the address it prints (usually http://localhost:3000).

## SEO notes

- Title and description are at the top of `index.html` (`<title>` and `<meta name="description">`).
- `sitemap.xml` has a `lastmod` date; update it when you make meaningful content changes.
- After the domain is live, submit the sitemap in [Google Search Console](https://search.google.com/search-console) (free) so Google indexes the site quickly.
- Structured data (Person, LocalBusiness, FAQ) can be tested at https://validator.schema.org.
