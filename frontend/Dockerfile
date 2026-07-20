FROM node:18-alpine

WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm install --force

# Copy source code
COPY . .

# Expose port mặc định của Vite
EXPOSE 5173

# Chạy ứng dụng Vite
CMD ["npm", "run", "dev"]
