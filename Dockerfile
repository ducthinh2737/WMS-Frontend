# --- Stage 1: Build the React/Vite application ---
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# This step is done separately to leverage Docker's cache
# If package*.json doesn't change, npm install won't re-run
COPY package*.json ./
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Install project dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the React/Vite application
# Assuming 'npm run build' generates output in the 'dist' directory
RUN npm run build

# --- Stage 2: Serve the built application with Nginx ---
FROM nginx:stable-alpine AS final

# Copy the built files from the 'build' stage into Nginx's HTML directory
# Make sure this path matches the output directory of your 'npm run build' command
# For Vite, it's typically 'dist'
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 (Nginx's default HTTP port)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]