FROM mcr.microsoft.com/playwright:v1.62.0@sha256:baed2032d533817f3dbe6425de795788430ba345e819a1201337009ba17c9d07

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib/package.json ./lib/package.json

WORKDIR /app/lib

RUN npm install -g corepack@latest
RUN corepack enable
RUN corepack prepare --activate

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY lib/playwright.config.ts lib/astro.config.mjs lib/tsconfig.json ./
COPY lib/tests ./tests
COPY lib/playground ./playground
COPY lib/src ./src

EXPOSE 9323

CMD ["sh", "-c", "xvfb-run pnpm run test"]
