# Use an official Node.js runtime as a parent image
FROM node:22

# Install cron
RUN apt-get update && apt-get install -y cron

# Set the working directory in the container
WORKDIR /usr/src/llmservice

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install --ignore-scripts

# Copy the app source code to the working directory
COPY . .

# Copiar el crontab al lugar correcto y registrarlo
RUN crontab ./scripts/cron/crontab.txt

# Asegurar permisos de ejecución para el script de inicio
RUN chmod +x start.sh

# Expose the port the app runs on
EXPOSE 8003

# Run the custom startup script
CMD ["./start.sh"]