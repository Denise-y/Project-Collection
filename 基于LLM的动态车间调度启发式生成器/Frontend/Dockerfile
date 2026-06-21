FROM node:20-alpine

WORKDIR /app

# Copy package definition files and install dependencies (use Docker cache)
COPY Frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY Frontend ./ 

EXPOSE 5173

# Serve via Vite dev server so others can access easily
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

