<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# now give me a summary of the tech stack that will be used

Here’s the concise tech stack for Kaleidoscope Dental Academy, matching your proposal plus payments.

***

## Frontend

- **Framework:** Next.js 15 (App Router, React 19) for SSR/SSG, SEO, routing, API routes, and good performance.[^1][^2][^3][^4]
- **Language:** TypeScript for type safety and better DX.[^5]
- **Styling:** Tailwind CSS + possibly Shadcn UI for a fast, consistent component library (buttons, cards, forms).[^5]
- **Animations:** Whisk and Flow exports wrapped as React components (Lottie/JS/CSS), lazy‑loaded inside Next pages to protect performance.[^5]

***

## Backend \& Data

- **Database:** Firebase **Cloud Firestore** for courses, registrations, case studies, settings, and admin users (NoSQL, real‑time, managed).[^6][^7][^8]
- **Auth:** Firebase Authentication for admin login (email/password, secure sessions).[^8][^6]
- **File storage:** Firebase Storage for course images, case‑study media, and possibly documents.[^7][^6]
- **Server side logic:**
    - Next.js **Route Handlers/Server Actions** for app APIs (checkout session creation, secure admin endpoints).[^2][^5]
    - Optional Firebase Cloud Functions for webhooks (Stripe/Paymob) and background tasks if you prefer them outside Next.[^6][^8]

***

## Payments

- **Payment processor:**
    - **Stripe** for international-friendly card payments and a clean Next.js integration.[^9][^10][^11]
    - Or **Paymob**/**Fawry** for Egypt‑friendly methods (architecture similar: create checkout → webhook → Firestore).[^7]
- **Flow:** Next.js route creates checkout session; Stripe/Paymob webhook marks `registration.paymentStatus = "paid"` in Firestore.[^10][^11][^9]

***

## Infrastructure \& DevOps

- **Hosting:**
    - **Vercel** for the Next.js app (global CDN, auto SSL, previews, good free tier).[^5]
    - **Firebase** for Firestore, Auth, Storage, and optional Functions (managed, autoscaling).[^6][^7]
- **Version control:** Git + GitHub repo, integrated with Vercel for CI/CD.[^5]
- **Environment \& tooling:**
    - ESLint + Prettier for code quality.[^5]
    - Cursor as the main IDE/AI pair‑programmer.

***

## Observability \& Email (lightweight)

- **Email sending:** Resend or EmailJS for registration confirmations and admin notifications (free tiers).[^12][^13]
- **Analytics:** Google Analytics and/or Vercel Analytics for traffic and conversion tracking.[^5]
- **Monitoring (optional):** UptimeRobot for uptime, Sentry for error tracking (both have free plans).[^13][^14]

This stack keeps infra simple and cheap, gives you excellent SEO and DX, and is flexible enough to evolve toward more advanced reporting or a custom backend later if needed.

<div align="center">⁂</div>

[^1]: https://focusreactive.com/how-nextjs-can-improve-seo/

[^2]: https://www.digitalapplied.com/blog/nextjs-seo-guide

[^3]: https://redliodesigns.com/blog/next-js-seo-why-its-the-best-choice-in-2025

[^4]: https://designtocodes.com/blog/why-next-js-is-the-best-framework-for-seo-in-2025/

[^5]: https://jigsdev.xyz/blogs/nextjs-performance-optimization

[^6]: https://www.softpost.org/tech/using-firebase-backend-service-vs-developing-custom-backend-pros-and-cons

[^7]: https://mobitouch.net/blog/firebase-vs-supabase-vs-custom-backend-which-backend-should-you-choose

[^8]: https://www.knguru.de/en/blog/firebase-vs-benutzerdefiniertes-backend

[^9]: https://www.reddit.com/r/nextjs/comments/1g3lwxd/integrating_stripe_with_nextjs_a_comprehensive/

[^10]: https://update.dev/blog/stripe-nextjs-integration

[^11]: https://dev.to/flnzba/33-stripe-integration-guide-for-nextjs-15-with-supabase-13b5

[^12]: https://codia.ai/ai-ui-design-generator

[^13]: https://uxmagic.ai/ai-ui-design-generator

[^14]: https://www.kdnuggets.com/how-to-build-production-ready-ui-prototypes-in-minutes-using-google-stitch

