# syntax=docker/dockerfile:1

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

RUN mkdir /app && chown -R node:node /app

WORKDIR /app

RUN mkdir -p /app/store && chown -R node:node /app/store

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
COPY --chown=node:node . .

# Run the application.
CMD npm start