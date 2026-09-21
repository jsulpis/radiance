FROM mcr.microsoft.com/playwright:v1.63.0@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27

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
