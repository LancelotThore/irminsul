# ---- Build stage: compile TypeScript ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts skips the "prepare" script (husky), which fails here: there's no
# .git in the build context, and husky isn't even installed in the production stage
# (it's a devDependency), so the "husky" command wouldn't exist to run in the first place.
RUN npm ci --ignore-scripts

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# ---- Production stage: runtime only ----
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/dist ./dist
COPY drizzle ./drizzle

CMD ["node", "dist/src/index.js"]
