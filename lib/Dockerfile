FROM mcr.microsoft.com/playwright:v1.61.0@sha256:57b65fdc9ceabe0ef613124c7bbe2babcf9362c4d85e382fe3b03604e84b428a

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
