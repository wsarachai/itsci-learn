# Stage 1: Build React SPA
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund
COPY . .
# Sub-path ที่เว็บถูกเสิร์ฟ เช่น /WellnessTourism (ว่าง = เสิร์ฟที่ราก /)
ARG PUBLIC_URL=
ENV PUBLIC_URL=$PUBLIC_URL
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Serve static files with lightweight Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
