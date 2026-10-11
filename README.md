# GrandVillage

A responsive intergenerational care marketplace, built from the supplied Stitch design exports with an ivory, plum, and terracotta design system. Next.js + TypeScript, Motion for React, Three.js / React Three Fiber / Drei, Supabase, and Stripe test-checkout scaffolding.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. The provided Supabase project URL and publishable key are configured in ignored `.env.local`. Never commit secret keys. Fonts and imported Stitch images are served locally.

```sh
npm run typecheck
npm test
npm run build
npm start
```

Production builds use Webpack because Turbopack's build worker encountered a local port/sandbox issue in this environment. Development uses Turbopack. Node 20.9+ is required by Next.js; developed on Node 24.

## What works without any additional setup

The explicitly labeled demo persists fictional data in this browser's localStorage and synchronizes data changes between same-origin tabs. It is not an access-control boundary and must contain no real family information.

- Public homepage, service discovery, neighborhood/language/budget filters, saved hosts, host profiles.
- Parent and host dashboards, requests, accept/decline, overlap detection, booking details, cancellation of unpaid requests.
- Simulated checkout (no card data or charges), receipt downloads, earnings breakdown.
- Booking chat, host care updates, completion, one review per participant, return to the host to book again.
- Schedule/calendar with month navigation and saved availability, profile editing, support cases.
- Admin demo for listing visibility, bookings, payment inspection, and support resolution.
- Four-step host onboarding, Supabase email/password login/signup and password-reset UI.
- Motion transitions with reduced-motion support; decorative Three.js village with an error fallback.

Start at `/parent`. The **Explore as** menu switches between parent, senior host, and admin. Switching while in a booking preserves the booking page. Demo host is Eleanor; use her profile for a full two-role journey. Use `/parent/account` to reset local demo records.

## Main routes

| Area           | Routes                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Public         | `/`, `/hosts`, `/hosts/:id`, `/join`, `/login`, `/reset-password`, `/support`                    |
| Parent         | `/parent`, `/parent/bookings`, `/parent/messages`, `/parent/account`, `/parent/payments`         |
| Host           | `/host`, `/host/requests`, `/host/schedule`, `/host/messages`, `/host/earnings`, `/host/profile` |
| Shared booking | `/bookings/:id`                                                                                  |
| Admin          | `/admin`, `/admin/users`, `/admin/bookings`, `/admin/payments`, `/admin/support`                 |

## Connect the real Supabase database

The project URL and publishable key were verified with the Auth settings endpoint (HTTP 200). The database migration has **not been applied**: local CLI sign-in was not available during this build.

1. Sign in in your own terminal: `npx supabase login`.
2. From this folder: `npx supabase init` then `npx supabase link --project-ref ckvfhfoihmfwoijqbkns`.
3. Review `supabase/migrations/202610100001_grandvillage.sql`, then run `npx supabase db push` against the intended project. It creates new tables and fails transactionally if conflicting tables exist. It does not seed demo users into the live project.
4. In Supabase Authentication URL Configuration, add `http://localhost:3000/login` and `http://localhost:3000/reset-password` as redirect URLs and configure the production URL before deployment.
5. Create parent and host accounts through `/login`. Real hosts save a profile and add specific availability in `/host/schedule`.
6. Set an administrator role manually for the intended real operator using the SQL editor. Public signups can create only parent or host accounts. Review/approve host listings using the authenticated admin panel.

Schema protections include row-level policies, separate private care notes, server-validated booking actions, a database exclusion constraint for overlapping accepted bookings, participant-only messages/reviews, and restricted admin actions. Users cannot set their own admin role, payment status, booking totals, or approval status through direct table updates. Live database policies still need integration testing after migration.

Accounts created before the migration need a matching `profiles` record (and `host_details` for hosts), since the signup trigger handles new accounts only. Do not overwrite an existing project schema without reviewing it.

## Optional Stripe test integration

Live API checkout is implemented but **not configured or exercised against Stripe**. Only `sk_test_` keys are accepted. The demo checkout remains independent and explicitly simulated.

Set these in server-only `.env.local` values (see `.env.example`):

- `STRIPE_SECRET_KEY`: Stripe test secret key.
- `STRIPE_WEBHOOK_SECRET`: Signing secret for the local/test webhook endpoint.
- `SUPABASE_SECRET_KEY`: Server-only Supabase secret key for verified webhook reconciliation; never use a `NEXT_PUBLIC_` prefix.
- `APP_URL`: Application origin, default local URL.

Pre-onboard Stripe test connected accounts and insert their IDs into the private `host_payout_accounts` table. Checkout uses a destination charge with the booking's server-snapshotted 15% platform fee. The platform fee is not net platform revenue; Stripe fees may apply separately.

Send `checkout.session.completed` and `checkout.session.async_payment_succeeded` test events to `/api/stripe/webhook`. The endpoint verifies signatures and checks booking metadata, currency, amount, and test mode before a service-role-only RPC marks payment complete. Retrying an event is idempotent. Never trust a success URL alone. Bank payouts, real refunds, disputes, and connected-account onboarding UI are not implemented.

## Validation performed

- TypeScript check and optimized production build.
- Four booking-rule tests: time overlap, adjacent bookings, role restrictions, unpaid completion, paid cancellation, terminal states.
- Browser walkthrough: language filtering, request creation, host acceptance, private-notes visibility, message delivery across role views, simulated payment, completion, and review submission.
- Mobile layout checked at 390px: no horizontal overflow or broken images on the parent dashboard.

## Deliberate limits / next steps

- No live operational identity/background checks, insurance claims, emergency hotline, or fabricated testimonials.
- Real Supabase workflow/RLS and Stripe webhook integration require credentials and deployment validation.
- Booking acceptance currently reserves time until manually cancelled/completed. Automated unpaid-expiry and reminders are not implemented.
- Text-only care updates. Photos are available in booking messages; antivirus scanning and media retention workflows are deferred.
- Chat includes per-user read markers and unread navigation counts. Browser push is implemented with setup steps below. Email notifications are deferred.
- Browser-local demo reviews are clearly labeled. Live public review projection is deferred; live participants can access their own booking reviews.
- No public child profiles. Parent complaints are private to the requester and admin.
- Advanced compatibility scoring, AI support, video calls, automatic bank payouts, and multi-host concurrent care are deferred.

Imported images originate from the user-supplied Stitch exports. `scripts/import-assets.py` records the source mapping; it is not needed to run the app.

### Feedback workspace

Parents can use `/parent/feedback` to review completed bookings, filter by host, and revisit shared feedback. `/host/feedback` shows feedback received. The booking Review tab uses the same composer and stored reviews. Each booking accepts one parent review; feedback is visible to the booking participants and administrators. Apply both migrations, including `202610100002_parent_feedback.sql`, for the parent-only database policy. Demo feedback is saved in browser storage.

### Photos and parent reminders

Booking Messages now accepts one JPG/PNG/WebP photo per message (5 MB input limit). The browser re-encodes the photo as JPEG, removes original metadata, and limits its dimensions. Demo photos remain in browser storage. Live photos use the private `chat-photos` Supabase bucket with participant-only policies and one-hour signed links. Apply migrations `202610100003_chat_photos.sql` and `202610100004_browser_push.sql` after the earlier migrations. Photo messages support an optional text caption. Message reads are recorded only while the conversation tab is visible.

Parents have a Reminders page, bell count, and dashboard reminder banner. Links open the matching booking conversation; unread reminders clear when it is viewed. These are booking-specific parent/host groups, not groups with additional family members.

Browser push setup:
1. `npm run push:keys` generates keys once into ignored `.env.local`; keys were generated during implementation. Keep them stable across deployments.
2. Add the server-only `SUPABASE_SECRET_KEY` and set `VAPID_SUBJECT` to your real contact `mailto:` address. Never prefix these secrets with `NEXT_PUBLIC_` or send them in chat.
3. Apply the migrations and restart. In a live parent account, open **Reminders → Enable notifications** and allow the browser prompt. HTTPS is required when deployed (localhost supports development). iOS support depends on an installed home-screen web app; no iOS install flow is provided yet.
4. Host messages enqueue push reminders in the database. The API attempts delivery after saving the message. For retries or messages inserted outside this app API, configure your hosting scheduler to POST `/api/push/dispatch` with `Authorization: Bearer <PUSH_DISPATCH_SECRET>` every minute. No scheduler is provisioned automatically. Jobs have five attempts and a one-hour delivery window. Expired endpoints are removed. Already-read messages are skipped. Multiple devices receive notifications; retries may repeat notifications on a device if another device failed, with a per-booking tag to group them.
5. Test with two real accounts: enable push as parent, close the parent tab, send text and a photo as host, open the notification, and verify it opens the correct conversation. Test denied permission and disabling notifications as well.

Push previews contain no chat text, photo, or child details. Browser/OS settings affect delivery. Live storage policies and actual remote push delivery cannot be verified until the Supabase migration and server credentials are configured. The demo does not send browser push or external messages.
