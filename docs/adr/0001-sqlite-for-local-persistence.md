# SQLite for local persistence

Todos and Tags are stored in a single SQLite file (`todo.db`) through EF Core 10 code-first migrations, rather than PostgreSQL in Docker. This is a local-only learning project for a developer new to the backend: SQLite needs no Docker or server, so each step's time goes into learning EF (DbContext, relationships, migrations) instead of debugging setup, and those concepts carry over unchanged to PostgreSQL or SQL Server. SQL Server was never an option: its containers are unsupported on Apple Silicon.

## Consequences

- Migrations are provider-specific. Moving to PostgreSQL later means regenerating the migration set; entities, `DbContext` and queries stay as they are.
- SQLite's `NOCASE` collation folds only A–Z, so the unique index on Tag names treats `Café` and `CAFÉ` as different. Accepted for a personal list; a normalized-name column would fix it in one migration.
