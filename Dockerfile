FROM node:20-alpine

WORKDIR /app

# Copy backend package dependencies
COPY backend/package*.json ./backend/

# Install production dependencies
RUN cd backend && npm install --production

# Copy backend source code
COPY backend ./backend

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["node", "backend/websocketServer.js"]
