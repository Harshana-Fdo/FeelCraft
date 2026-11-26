# Project requirements

FeelCraft is a digital letter studio for Love, Anger, Sadness, Apology and Secret Crush. Creators will choose a feeling, start from a template or blank canvas, personalize the design, preview it, and publish an unlisted link. Recipients will open the letter without an account.

Phase 1 delivers the public experience and API foundation. Sample letters use five local, versioned fixtures. Creator and recipient workflows involving actual user content start in later phases. Public feeds, chat, dating, matchmaking and automatic message delivery are out of scope.

## Technology

- React, JSX, Vite, Tailwind CSS, shadcn-compatible components, React Router, Axios, Framer Motion and Lucide.
- Use Zustand and React-Konva for the planned editor.
- Express and Node.js with dotenv, Helmet, CORS and API rate limiting. Use mysql2 promise pools, JWT, bcrypt, Multer and Express Validator when their features are introduced.
- MariaDB 10.4+ or MySQL 8+ for persistent application data through mysql2. Use parameterized SQL, foreign keys and versioned migrations.
- Store development media locally and configure Cloudinary for production.
- Vitest and React Testing Library for frontend tests, Supertest for HTTP checks and Playwright for browser verification.

## Acceptance priorities

- Recipients can open accessible, reduced-motion-aware experiences without signing in.
- Published designs use immutable snapshots and secure, revocable, expiring URLs with optional passwords.
- Creator roles, account lifecycle, dashboard, editing, media, favorites, analytics, reporting and administrative moderation are backed by server-side authorization.
- Premium markers describe the template catalog. Payments require a separately configured provider.
