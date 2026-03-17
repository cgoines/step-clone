# Use Node.js Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better Docker layer caching)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port 3002
EXPOSE 3002

# Start the development server (for dev) or serve built files (for prod)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3002"]