# Deployment notes

## Environment variables

Set these in your production environment:

- **`NEXT_PUBLIC_SITE_URL`** – Full public URL of the site (e.g. `https://kaleidoscopedentalacademy.com`). Used for sitemap, robots, canonical URLs, and Open Graph.

Optional (for search engine verification):

- **`GOOGLE_SITE_VERIFICATION`** – Content value from the Google Search Console HTML meta tag (the part that goes in `content="..."`).
- **`BING_SITE_VERIFICATION`** – Content value from the Bing Webmaster Tools meta tag (the part that goes in `content="..."`).

## Support URL

Support is provided through the contact page. The canonical support URL is:

**Support URL:** `{NEXT_PUBLIC_SITE_URL}/contact`

All in-app “Contact” and “Contact support” links point to `/contact`. Ensure `NEXT_PUBLIC_SITE_URL` is set in production so any absolute links (e.g. in emails) use the correct domain.

## Google Search Console and Bing Webmaster Tools

1. **Google Search Console:** Add your property → choose “HTML tag” verification → copy the `content` value from the meta tag → set it as `GOOGLE_SITE_VERIFICATION` in your env and redeploy.
2. **Bing Webmaster Tools:** Add your site → choose “Meta tag” verification → copy the `content` value → set it as `BING_SITE_VERIFICATION` in your env and redeploy.
3. **Sitemap:** After verification, submit your sitemap in both tools: `{NEXT_PUBLIC_SITE_URL}/sitemap.xml`
