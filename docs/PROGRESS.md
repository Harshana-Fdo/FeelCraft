# Progress

## Temporary HTTPS sharing

- Added a loopback-only preview option for the built frontend and kept its API proxy. Cloudflare Quick Tunnel forwards only that frontend port.
- The API accepts the configured local and public origins and issues Secure session cookies for the HTTPS preview. Share links use the configured public origin.
- Public requests for environment files, phpMyAdmin and Vite development paths returned the generic SPA shell. The public API health and catalog requests succeeded.
- Documented the three PowerShell startup terminals and tunnel shutdown in the README.

## Phase 4 publishing and recipients

- Added publication and sharing dialogs to the account editor. The server copies renderable layers and the selected identity into a saved snapshot with a new token. Later draft changes do not modify the snapshot.
- Added account-free recipient pages with five mood styles, password unlock, expiration, replay, reduced-motion support, optional ambient audio, dismissal and abuse reporting.
- Added the Published Messages dashboard with saved preview, sharing, opens, password and expiration edits, revocation, unpublishing, new versions and deletion.
- Applied migrations 003 and 004 to XAMPP MariaDB 10.4.32. Migration 004 resolved an overlapping foreign-key cascade exposed by integration testing.
- Lint and the production build passed. One frontend test and six backend tests passed, including two live database integrations. Six live auth and publication browser checks and sixteen guest catalog and editor regressions passed on desktop and mobile.
- The live browser tests exercised photo and text editing, anonymous protected publication, clipboard and QR sharing, the WhatsApp URL, opening from a signed-out session, replay, reporting, expiry and revocation. They also verified the snapshot survives subsequent draft edits.
- Local links use the configured frontend origin. Deployment to a public HTTPS origin and a moderation review dashboard are future work. Await Phase 4 review before starting Phase 5.

## Public authentication

- Added visible Sign In and Sign Up controls on desktop and mobile, plus a signed-in profile dropdown with My Creations, Account Settings and Logout.
- Added confirmation, password visibility, validation and feedback to the account forms. Account Settings saves the display name through the authenticated API.
- Guests can sign in or register from a local draft and save a copy to MariaDB from their dashboard. The original remains available in local drafts.
- Lint, build, one frontend test and five backend tests passed. All 16 public and editor regression checks passed. The four authentication browser checks passed in isolation against XAMPP MariaDB on desktop and mobile after the combined run hit the local API rate limit.

## XAMPP MariaDB integration

- Connected to `feelcraft_db` on the existing XAMPP MariaDB 10.4.32 endpoint through mysql2 and the configured environment.
- Applied both migrations and seeded the five editable templates. A second run skipped both migrations.
- The live integration test passed for catalog reads, registration, login, refresh rotation, saving Sinhala text, reopening, duplication and deletion. The test cleans up its temporary account and drafts.
- A browser smoke test signed up, edited and autosaved an account draft, reloaded it, duplicated it from the dashboard, and signed out and back in. All 16 desktop and mobile regression checks also passed against the running app.
- The shared schema and repositories target MySQL 8 as well. This verification used MariaDB.

## Phase 2 and Phase 3

- Implemented MySQL migrations, five seeded editable templates, catalog endpoints, registration, sign-in, JWT access tokens and cookie-backed refresh rotation.
- Implemented owner-scoped drafts with create, load, revision-checked save, duplicate and delete. Browser-local drafts use IndexedDB.
- Added template customization and blank-canvas creation. The React-Konva editor supports text and photos, shapes and decorations, background editing, transforms, layers, undo and redo, zoom and autosave.
- Added desktop and mobile previews with opening, background and layer effects. English and Sinhala text remain editable after saving and reopening.
- The production build and lint pass. The frontend component test and four backend smoke tests pass. A separate real MySQL integration test is available when a migrated instance is configured.
- All 16 Edge Playwright checks passed across desktop and mobile. They verify canvas dragging, resizing and rotation, Sinhala text editing, photo upload, manual and automatic saves, reopening, duplication, deletion, and animated previews.
- The original MySQL-only migration was blocked by a collation unsupported by MariaDB 10.4. The XAMPP integration above resolves that blocker.
- Started both apps on ports 5183 and 5001. The direct editor route and proxied health request returned HTTP 200, and the unsupported database returned 503 on catalog requests.

## Phase 1 delivery record

## Phase 1 implementation

- Scaffolding, shared commands, safe environment examples, public routes and an independent Express liveness endpoint.
- Responsive landing page, five emotional categories, searchable gallery with feeling, style and collection filters, five template detail pages and recipient demos.
- Original SVG illustrations, Playfair Display and Inter, Sinhala fallback, keyboard navigation, reduced-motion support, and replayable reveals.
- Requirements, architecture, proposed database diagram, live API contract, template format and staged roadmap.

## Verification

Verified on Windows with Node.js 24.12.0, npm 11.6.2 and Microsoft Edge Chromium.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed for both applications |
| `npm run build` | Passed. Output is in `frontend/dist` |
| `npm test` | One React component test and three API smoke tests passed |
| `npm run test:e2e` | Ten checks passed across desktop and mobile viewport projects |
| `npm run dev` | Both apps started using the documented port override. The landing page, direct health request, and proxied health request returned HTTP 200 |
| Install audits | No known vulnerabilities reported after pinning the backend Nodemon development dependency to 3.1.11 |

Checked desktop and mobile landing page screenshots. Playwright covers the gallery filters, category-to-letter navigation, the animation, reduced motion, focus, all five sample letters, and the 404 route.

## Phase 1 boundaries at delivery

- Browser-local public fixtures serve the sample letters. The create action chooses a sample design to preview.
- Windows reserves port 5000 on the development machine. The configured default remains 5000. Use the README's port 5001 override on this machine.
- MySQL80 is stopped and the MySQL CLI was absent from PATH. No database work is needed for Phase 1.
- Accounts, legal policy pages, the creator dashboard, interactive design editing, persistence, real share links, reports and moderation come later.
- Phase 1 review was required before beginning MySQL and authentication. That review is complete.
