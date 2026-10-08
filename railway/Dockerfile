FROM node:20-slim

WORKDIR /app

# Copy worker code
COPY workers/worker.js ./
COPY package.json ./

# Install dependencies (none needed — worker.js uses native fetch)
RUN npm install --omit=dev || true

# Set environment
ENV NODE_ENV=production

# Run worker (task name passed as argument by Railway cron)
CMD ["node", "worker.js"]