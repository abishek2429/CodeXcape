# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

