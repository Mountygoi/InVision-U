# Stage 1: Build client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ ./
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci
COPY server/ ./
RUN npx tsc -p tsconfig.build.json

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

# Install production deps only
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev

# Copy compiled server
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/types.ts ./server/types.ts

# Copy built client
COPY --from=client-build /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p /app/server/uploads

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "dist/index.js"]
