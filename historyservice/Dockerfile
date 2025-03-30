# Usar una imagen base de Node.js
FROM node:18

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto del código del servicio
COPY . .

# Exponer el puerto 8010
EXPOSE 8010

# Comando para iniciar la aplicación
CMD ["npm", "start"]