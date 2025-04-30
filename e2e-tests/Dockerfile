# Usa una imagen base de Node.js
FROM node:16

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar el package.json y el lock file para instalar dependencias
COPY package*.json ./

# Instalar dependencias de los tests
RUN npm install

# Copiar el código de los tests al contenedor
COPY . .

# Exponer el puerto si necesitas (no obligatorio para tests)
EXPOSE 3000

# Ejecutar los tests de Cucumber
CMD ["npm", "run", "test:e2e"]
