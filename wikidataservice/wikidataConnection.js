let fetch;

async function loadFetch() {
    // Cargar 'node-fetch' de forma dinámica
    const module = await import('node-fetch');
    fetch = module.default;
}

import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 1800 }); // Caché de 30 minutos

// Asegurarse de que fetch esté disponible antes de hacer la consulta
export async function consulta(query) {
    await loadFetch();  // Espera a que `fetch` esté disponible
    const apiUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
    console.log("Ejecutando consulta SPARQL:", query);

    // Verificar caché antes de consultar a Wikidata
    const cachedResult = cache.get(query);
    if (cachedResult) {
        console.log("✅ Resultado obtenido desde caché.");
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

            if (!respuesta.ok) throw new Error(`Error en la consulta: ${respuesta.statusText}`);

            const datos = await respuesta.json();
            const resultados = datos.results.bindings.map(resultado => {
                return Object.fromEntries(
                    Object.entries(resultado).map(([clave, valor]) => [clave, valor.value])
                );
            });

            // Almacenar en caché antes de devolver
            cache.set(query, resultados);
            return resultados;

        } catch (error) {
            console.error(`⚠️ Intento fallido (${4 - intentos}): ${error.message}`);
            intentos--;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2 seg antes de reintentar
        }
    }

    console.error("No se pudo completar la consulta tras múltiples intentos.");
    return null;
}