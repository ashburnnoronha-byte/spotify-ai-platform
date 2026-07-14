FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
# Default to the Render API URL so the browser talks to the public service
# (private nginx→API proxy is unreliable on Render free tier). Override to
# empty string for docker-compose.prod.yml nginx-proxied relative /api/v1.
ARG VITE_API_URL=https://spotify-ai-api.onrender.com/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache gettext
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENV PORT=80
ENV BACKEND_UPSTREAM=backend:8000
EXPOSE 80
CMD ["/docker-entrypoint.sh"]
