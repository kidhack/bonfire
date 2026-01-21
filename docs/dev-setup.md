# Dev setup (M0)

## Install dependencies

```bash
pnpm install
```

## Start Postgres

```bash
docker compose up -d
```

## Prepare database

```bash
cp packages/db/.env.example packages/db/.env
pnpm --filter @bonfire/db prisma:generate
pnpm db:migrate
pnpm db:seed
```

## Clean Next.js dev lock (if needed)

```bash
pnpm dev:clean
```

If you still see a lock error, ensure no lingering Next.js process is running, then retry.

## Nuke Next.js cache (if needed)

```bash
pnpm dev:nuke
```

## Run quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Storybook (UI)

```bash
pnpm --filter @bonfire/ui storybook:dev
```

## Run the web app

```bash
pnpm web:dev
```

Note: local dev sets `NEXT_DISABLE_TURBOPACK=1` and `NEXT_DISABLE_WEBPACK_CACHE=1`, and uses
`next dev --webpack` to avoid Turbopack persistence issues and webpack cache ENOENT warnings.
The `predev` step also creates placeholder manifest files to avoid first-run ENOENT errors.
The web dev script also pre-creates `.next/dev/server` and the webpack cache directories under
`apps/web/.next/dev/cache/webpack`.

## Find Next.js dev processes

```bash
pnpm web:kill
```
