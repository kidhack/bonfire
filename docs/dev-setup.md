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

## Find Next.js dev processes

```bash
pnpm web:kill
```
