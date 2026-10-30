# Deploying to Netlify and connecting lubertlatin.com

Total time: about 20 minutes, plus DNS waiting time.

## Part 1 — Connect GitHub to Netlify (one time)

1. Go to https://app.netlify.com and sign up with **GitHub** (click "Sign up with GitHub" and authorize). Using your GitHub login means Netlify can see your repositories.
2. Click **Add new site → Import an existing project → GitHub**.
3. If asked, click **Configure Netlify on GitHub** and give it access to the `jacoblubert-latin/lubertlatin.com` repository (or all repositories).
4. Pick the **lubertlatin.com** repository.
5. Settings screen: Netlify reads `netlify.toml` and fills everything in. Confirm:
   - Branch to deploy: `main`
   - Build command: *(empty)*
   - Publish directory: `site`
6. Click **Deploy**. In about a minute you'll have a temporary address like `https://something-random-123.netlify.app`. Open it and check the site works.
7. Optional: **Site configuration → Site details → Change site name** to `lubertlatin` so the temporary address is `lubertlatin.netlify.app`.

### Turn on form notifications

1. **Forms** (left sidebar). You should see `contact` and `id-sheet` listed. (If you don't, send a test submission from the live site once; they'll appear.)
2. **Forms → Form notifications → Add notification → Email notification**. Enter your email, choose "All forms". Now every contact message and PDF signup lands in your inbox.

## Part 2 — Connect the domain

### On Netlify

1. **Domain management → Add a domain** (or "Add custom domain").
2. Type `lubertlatin.com` and click **Verify**, then **Add domain**. It will say "Check DNS configuration" — that's expected until Part 3 is done.
3. Netlify automatically also adds `www.lubertlatin.com` and will redirect it to the main domain.

### At Porkbun (Part 3 — the DNS records)

1. Log in at https://porkbun.com → **Domain Management** → click **DNS** next to `lubertlatin.com`.
2. **Delete** the default records Porkbun created (usually an `ALIAS` and a `CNAME` pointing to `pixie.porkbun.com`). Leave any `MX` or `TXT` records alone if you've set up email on the domain.
3. **Add** these two records exactly:

   | Type  | Host  | Answer / Value                  | TTL |
   |-------|-------|---------------------------------|-----|
   | ALIAS | *(leave blank)* | `apex-loadbalancer.netlify.com` | 600 |
   | CNAME | `www` | `lubertlatin.netlify.app`       | 600 |

   Notes:
   - For the first record, Porkbun's "Host" field left blank means the bare domain (`lubertlatin.com`). Porkbun supports ALIAS at the root, which is the best option. If ALIAS gives you any trouble, use an **A** record with the value `75.2.60.5` instead.
   - For the CNAME, use your real Netlify site address (whatever `*.netlify.app` name Netlify gave you in Part 1, step 6–7).

4. Save. DNS changes usually take 5–30 minutes but can take a few hours.

### Back on Netlify

1. **Domain management**: after DNS propagates, the warning next to `lubertlatin.com` disappears.
2. Scroll to **HTTPS**. Netlify issues a free Let's Encrypt certificate automatically once DNS is confirmed. If it hasn't after an hour, click **Verify DNS configuration** then **Provision certificate**.
3. Make sure `lubertlatin.com` is the **primary domain** (Options → Set as primary domain) so `www` and `netlify.app` addresses redirect to it.

Done. https://lubertlatin.com is live with HTTPS.

## Part 4 — After launch (10 minutes, worth it)

1. **Google Search Console**: https://search.google.com/search-console → Add property → "Domain" → `lubertlatin.com`. It gives you a TXT record to add at Porkbun (same DNS page, type `TXT`, host blank). Once verified, go to **Sitemaps** and submit `https://lubertlatin.com/sitemap.xml`.
2. **Google Business Profile** (optional but strong for "Latin tutor Phoenix" searches): https://business.google.com. Choose "service-area business" so no street address is shown.
3. Test social previews: paste `https://lubertlatin.com` into https://www.opengraph.xyz to see the sharing card.
4. Send yourself a test message through the contact form and a test PDF signup, and confirm both arrive by email.

## Making changes later

Push to `main` on GitHub (see README) and Netlify redeploys automatically. Each deploy shows in **Deploys** with a preview; you can roll back to any earlier deploy with one click there.

## If something goes wrong

- **Site shows "Page not found" on Netlify**: check that the publish directory is `site` (Site configuration → Build & deploy).
- **Forms don't appear in Netlify**: forms are detected at deploy time. Trigger a redeploy (Deploys → Trigger deploy) and submit a test.
- **Domain says "DNS verification failed"**: at Porkbun, confirm there's no leftover `A`/`ALIAS`/`CNAME` for the root or `www` besides the two above. Use https://dnschecker.org to see what the world currently sees for `lubertlatin.com`.
