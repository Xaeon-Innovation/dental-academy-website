# SEO and keyword research

## Keyword list

The site uses a default set of keywords in the root layout and on key pages (About, Contact, Courses, Blog). These are placeholders based on the academy’s offerings.

**You should replace or extend them with the results of your own keyword research** (e.g. Google Keyword Planner, Ahrefs, or manual research). Focus on terms your audience actually searches for, such as:

- Course names: “iPlace course”, “iRestore course”, “Full Arch training”
- Intent: “dental implant training UK”, “CPD dental courses”, “implant training for dentists”
- Brand: “Kaleidoscope Dental Academy”

## Where keywords are set

- **Root layout** ([web/src/app/layout.tsx](web/src/app/layout.tsx)): default `keywords` for the whole site; also sets `metadataBase`, Open Graph, and Twitter cards.
- **Key pages**: Each of About, Contact, Courses, and Blog has its own `metadata.keywords` so page-specific terms can be used. Avoid duplicating the same long list on every page; keep keywords relevant to each page.

Update these when you have a final keyword list from your research.
