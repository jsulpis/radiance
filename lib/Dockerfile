FROM mcr.microsoft.com/playwright:v1.65.1@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
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
