# API documentation

Development origin is `http://localhost:5000` by default. The frontend uses `/api` through Vite. Success responses use `{ "success": true, "message": "...", "data": {} }`. Errors use `{ "success": false, "message": "...", "errors": [] }`.

| Method and path | Request | Result |
| --- | --- | --- |
| GET /api/health | Public | Process liveness independent of the database |
| GET /api/categories | Public | Ordered feeling collection |
| GET /api/categories/:slug | Public | Feeling details or 404 |
| GET /api/templates | Public | Published template metadata and editable documents |
| GET /api/templates/:slug | Public | Published template or 404 |
| GET /api/templates/category/:slug | Public | Templates for a feeling |
| POST /api/auth/register | Name, email and password JSON | 201 with user and access token. Sets refresh cookie |
| POST /api/auth/login | Email and password JSON | User and access token. Sets refresh cookie |
| POST /api/auth/refresh | Refresh cookie | Rotates cookie and issues new access token |
| POST /api/auth/logout | Refresh cookie | Revokes cookie session and clears cookie |
| PATCH /api/auth/profile | Bearer token. Display name in `name` | Updated profile name, email and role |
| GET /api/designs | Bearer token | Up to 100 drafts ordered by update time |
| POST /api/designs | Bearer token. Title, nullable templateSlug, document | 201 with new draft |
| GET /api/designs/:id | Bearer token | Owner's document and revision |
| PUT /api/designs/:id | Bearer token. Title, document, current revision | New revision or 409 if draft changed |
| POST /api/designs/:id/duplicate | Bearer token | 201 with independent copy |
| DELETE /api/designs/:id | Bearer token | Deletes owner's draft |

Authentication uses a 15-minute JWT access token and a seven-day opaque refresh token in an HttpOnly, SameSite=Strict cookie. The cookie requires HTTPS in production. Its digest is stored in the database and exchanged in a transaction. Browser auth operations verify the configured origin. Credentials are bcrypt-hashed, and sign-in and registration have dedicated rate limits.

Invalid input returns 400, anonymous design requests return 401, and design IDs outside the current account return 404. The API accepts up to 4 MiB of draft JSON per request. Unavailable database-backed routes return 503 while the health route stays available. The browser uses IndexedDB for guest drafts.

## Publications

| Method and path | Request | Result |
| --- | --- | --- |
| GET /api/publications | Bearer token. Optional `design` UUID filter | Latest owned publication metadata and configured share URLs |
| POST /api/publications | Bearer token. `designId`, `title`, `identity`, `category`, `openingAnimation`, and `backgroundEffect`. Optional `recipient`, `sender`, `signature`, `music`, `password`, `expiresAt` | Immutable saved version and new link |
| GET /api/publications/:id/preview | Bearer token. Owner only | Saved recipient snapshot |
| PATCH /api/publications/:id/privacy | Bearer token. Optional `password` and UTC ISO `expiresAt` | New password or expiration settings. Null clears either setting |
| POST /api/publications/:id/revoke | Bearer token. Owner only | Revokes link |
| POST /api/publications/:id/unpublish | Bearer token. Owner only | Removes the published version from public access |
| DELETE /api/publications/:id | Bearer token. Owner only | Deletes published version |
| GET /api/messages/:token | Public. Recipient bearer grant when protected | Sanitized snapshot or locked status |
| POST /api/messages/:token/unlock | Password JSON | Snapshot and 15-minute publication-specific grant |
| POST /api/messages/:token/views | Public. Recipient grant when protected | Increments aggregate opens |
| POST /api/messages/:token/reports | `reason` and optional `details`. Recipient grant when protected | Records an abuse report |

Identity accepts `named`, `signature`, or `anonymous`. Music accepts `ambient` or null. Recipient responses exclude internal identifiers, owner metadata, passwords, hidden layers and non-rendering fields. They use 401 for locked or incorrect credentials, 404 for missing or unpublished messages, and 410 for expired or revoked links. Access changes invalidate previously issued unlock grants. Locked responses contain no snapshot. Reports accept harassment, threat, impersonation, or other. Viewing and reporting endpoints apply current access rules.

Account recovery, email verification and the moderation review dashboard remain later milestones.
