// Script pensado para usar crontab con el.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../llmservice/.env') });
const { generateQuestionForEntry } = require('../llm-service');
const { getWikidataForCategory } = require('../llm-service');

// Lista de categorías
const categories = [
  "paises",
  "monumentos",
  "elementos",
  "peliculas",
  "canciones",
  "formula1",
  "pinturas",
];

// Tu API key del LLM (si la usas)
const apiKey = process.env.LLM_API_KEY; 

(async () => {
    for (const category of categories) {
        try {
            //Generamos 3 preguntas por categoría: 21 en total
            for(i = 0; i < 3; i++){

                const entry = await getWikidataForCategory(category, 1);
                if (!entry) {
                    console.warn(`No se encontró entrada para categoría: ${category}`);
                    continue;
                }
            
                const wrappedEntry = { data: entry }; // Adaptamos para el formato esperado
                const question = await generateQuestionForEntry(wrappedEntry, apiKey);
                console.log(`\n Category: ${category}`);
                console.log(`Generated question: ${question}\n`);
            }
        } catch (err) {
          console.error(`Error generating question for ${category}:`, err.message);
        }
      }

  console.log("Ended generation of questions");
})();
