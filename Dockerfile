FROM node:24-alpine

WORKDIR /app

# Install dependencies needed for pandoc and binaries
RUN apk add --no-cache pandoc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# DevDependency in package.json; needed to run TypeScript without a separate emit step
RUN npm install -g tsx@4.19.3

COPY tsconfig.json ./
COPY src ./src

RUN mkdir -p uploads

ENV NODE_ENV=production

CMD ["tsx", "src/index.ts"]
