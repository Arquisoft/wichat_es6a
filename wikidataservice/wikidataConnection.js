const fetch = require('node-fetch'); // Carga directa de node-fetch
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 1800 }); // Caché de 30 minutos

// Función principal para hacer consultas SPARQL a Wikidata
async function consulta(query) {
    const apiUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
    console.log("Ejecutando consulta SPARQL:", query);

    // Verificar si el resultado ya está en caché
    const cachedResult = cache.get(query);
    if (cachedResult) {
        console.log("Resultado obtenido desde caché.");
        return cachedResult;
    }

    let intentos = 3;

    while (intentos > 0) {
        try {
            const respuesta = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'QuestionCrawler/1.0',
                    'Accept': 'application/json'
                }
            });

            if (!respuesta.ok) {
                throw new Error(`Error en la consulta: ${respuesta.statusText}`);
            }

            const datos = await respuesta.json();
            const resultados = datos.results.bindings.map(resultado => {
                return Object.fromEntries(
                    Object.entries(resultado).map(([clave, valor]) => [clave, valor.value])
                );
            });

            cache.set(query, resultados);
            console.log("Resultado obtenido de Wikidata y almacenado en caché.");
            return resultados;

        } catch (error) {
            console.error(`Intento fallido (${4 - intentos}): ${error.message}`);
            intentos--;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    console.error("No se pudo completar la consulta tras múltiples intentos.");
    return null;
}

module.exports = { consulta };
