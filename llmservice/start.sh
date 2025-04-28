#!/bin/bash
# Iniciar cron en segundo plano
cron
# Ejecutar el script una vez al iniciar
echo "Executing generation of questions..."
node /usr/src/llmservice/scripts/generate-questions.js >> /var/log/generate-questions.log 2>&1
# Iniciar la app
echo "Iniciando llm-service.js..."
node /usr/src/llmservice/llm-service.js
