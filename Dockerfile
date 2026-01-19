# ---------- Stage 1: Build ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files trước để tận dụng cache
COPY package*.json ./

# Build-time env cho Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build React/Vite
RUN npm run build


# ---------- Stage 2: Nginx ----------
FROM nginx:stable-alpine

# Copy Nginx config (FIX refresh 404 + proxy API)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
