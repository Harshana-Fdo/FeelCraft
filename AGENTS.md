# FeelCraft repository instructions

- Work in the existing root. Keep frontend and backend independently installable and runnable. Use the root package only for shared scripts and tools.
- Use JavaScript ES modules, JSX, React, Vite and Tailwind on the frontend. Use Express and mysql2 promise pools with XAMPP MariaDB and MySQL-compatible SQL. See docs/PROJECT_REQUIREMENTS.md for the full stack.
- Follow docs/DEVELOPMENT_ROADMAP.md. Phase 4 review is required before beginning Phase 5.
- Keep HTTP handlers, business rules and SQL separate. Parameterize queries and version database changes under database/migrations.
- Keep template and design data versioned. Validate documents on the server before persistence. Render text as text and allow only trusted image sources.
- Preserve ownership and role checks on the backend. Protect token and media handling. Never commit credentials or private content.
- Treat publications as immutable snapshots. Strip hidden layers, private fields and account metadata from recipient payloads. Keep social metadata generic and changes to access controls separate from snapshot contents.
- Clearly label development fixtures, upcoming functionality and any unverified behavior. Update docs/PROGRESS.md as features and checks change.
- Verify changes with relevant lint, build, and test commands. Ask before destructive operations.
