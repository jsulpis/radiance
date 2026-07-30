FROM mcr.microsoft.com/playwright:v1.62.1@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e

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
