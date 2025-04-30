// wikidataservice/wikidataCacheService.js

const WikidataEntry = require("./models/wikidata-entry-model");
const WikiQueries = require("./wikidataQueries");

class WikidataCacheService {
  constructor() {
    this.minEntriesPerCategory = 500;
    this.categories = [
      "paises",
      "monumentos",
      "elementos",
      "peliculas",
      "canciones",
      "formula1",
      "pinturas",
    ];
  }

  async getEntriesForCategory(category, count = 1) {
    try {
      const totalEntries = await WikidataEntry.countDocuments({ category });

      if (totalEntries >= count) {
        const randomEntries = await WikidataEntry.aggregate([
          { $match: { category } },
          { $sample: { size: count } },
        ]);
        return randomEntries;
      }

      // Si no hay suficientes, intenta buscar los que existen y añade los que falten
      console.warn(
        `⚠️ No hay suficientes (${totalEntries}) entradas cacheadas para '${category}'. Intentando buscar ${count}...`
      );
      const existingEntries = await WikidataEntry.find({ category });
      const neededEntries = count - existingEntries.length;

      if (neededEntries > 0) {
        console.log(
          `⏳ Intentando obtener ${neededEntries} nuevas entradas con imagen para ${category} ya que la caché está baja.`
        );
        const newEntries = await this.fetchAndSaveEntries(
          category,
          neededEntries // Pide las que necesita para llegar a 'count'
        );
        // Combina existentes y nuevas, y asegura no exceder 'count'
        return [...existingEntries, ...newEntries].slice(0, count);
      } else {
        return existingEntries;
      }
    } catch (error) {
      console.error(
        `❌ Error al obtener entradas para la categoría ${category}:`,
        error
      );
      return []; // Devuelve array vacío en caso de error
    }
  }

  async getRandomEntry() {
    try {
      // Selecciona una categoría aleatoria de la lista
      const randomCategory =
        this.categories[Math.floor(Math.random() * this.categories.length)];

      // Cuenta cuántas entradas hay para esa categoría
      const count = await WikidataEntry.countDocuments({
        category: randomCategory,
      });

      if (count === 0) {
        // Si no hay entradas, intenta llenar la caché para esa categoría
        console.warn(
          `🚫 No se encontraron entradas para ${randomCategory}, intentando obtenerlas...`
        );
        // Intenta obtener un número mínimo de entradas
        await this.fetchAndSaveEntries(
          randomCategory,
          this.minEntriesPerCategory // Intenta obtener el mínimo requerido
        );
        // Vuelve a contar después del intento
        const newCount = await WikidataEntry.countDocuments({
          category: randomCategory,
        });
        if (newCount === 0) {
          console.error(
            `❌ Sigue sin haber entradas para ${randomCategory} después del intento de fetch.`
          );
          return null; // Se rinde si sigue sin haber nada
        }
        // Si ahora hay entradas, selecciona una aleatoria
        const random = Math.floor(Math.random() * newCount);
        const entry = await WikidataEntry.findOne({
          category: randomCategory,
        }).skip(random);
        return entry;
      } else {
        // Si ya había entradas, selecciona una aleatoria
        const random = Math.floor(Math.random() * count);
        const entry = await WikidataEntry.findOne({
          category: randomCategory,
        }).skip(random);
        return entry;
      }
    } catch (error) {
      console.error("❌ Error al obtener una entrada aleatoria:", error);
      return null;
    }
  }

  async fetchAndSaveEntries(category, count = 10) {
    try {
      // Obtiene la función de consulta correcta para la categoría
      const queryFunction = this.getCategoryQueryFunction(category);
      if (!queryFunction) {
        throw new Error(`Categoría no válida: ${category}`);
      }

      // Ejecuta la consulta para obtener datos crudos de Wikidata
      const wikidataEntries = await queryFunction();
      console.log(
        `🔍 Obtenidas ${
          wikidataEntries?.length || 0
        } entradas crudas de WikiQueries para ${category}. Buscando ${count} con imagen...`
      );

      const savedEntries = [];
      if (!wikidataEntries || wikidataEntries.length === 0) {
        console.warn(
          `🤷‍♂️ No se obtuvieron entradas de WikiQueries para ${category}.`
        );
        return savedEntries; // Devuelve array vacío si no hay datos crudos
      }

      let savedCount = 0;
      // Itera sobre las entradas obtenidas hasta guardar 'count' entradas CON IMAGEN
      for (let i = 0; i < wikidataEntries.length && savedCount < count; i++) {
        const wikidataEntry = wikidataEntries[i];

        // --- GUARDAR SOLO SI TIENE IMAGEN ---
        if (
          wikidataEntry &&
          wikidataEntry.image &&
          wikidataEntry.image.trim() !== ""
        ) {
          const entryData = {
            category,
            rawData: wikidataEntry,
            imageUrl: wikidataEntry.image, // Asigna la URL de la imagen
          };

          switch (category) {
            case "paises":
              entryData.countryLabel = wikidataEntry.countryLabel;
              entryData.capitalLabel = wikidataEntry.capitalLabel;
              break;
            case "monumentos":
              entryData.monumentLabel = wikidataEntry.monumentLabel;
              entryData.countryLabel = wikidataEntry.countryLabel;
              break;
            case "elementos":
              entryData.elementLabel = wikidataEntry.elementLabel;
              entryData.symbol = wikidataEntry.symbol;
              break;
            case "peliculas":
              entryData.peliculaLabel = wikidataEntry.peliculaLabel;
              entryData.directorLabel = wikidataEntry.directorLabel;
              break;
            case "canciones":
              entryData.songLabel = wikidataEntry.songLabel;
              entryData.artistLabel = wikidataEntry.artistLabel;
              break;
            case "formula1":
              entryData.year = wikidataEntry.year;
              entryData.winnerLabel = wikidataEntry.winnerLabel;
              break;
            case "pinturas":
              entryData.paintingLabel = wikidataEntry.paintingLabel;
              entryData.artistLabel = wikidataEntry.artistLabel;
              break;
          }

          try {
            // Guarda la entrada en la base de datos MongoDB
            const newEntry = new WikidataEntry(entryData);
            await newEntry.save();
            savedEntries.push(newEntry);
            savedCount++; // Incrementa el contador solo si se guarda una entrada con imagen
          } catch (saveError) {
            // Maneja errores de guardado
            if (saveError.code !== 11000) {
              // Ignora errores de duplicado (código 11000)
              console.error(
                `❌ Error guardando entrada (${category}) con imagen: ${saveError.message}`
              );
            }
            // Continúa con la siguiente entrada aunque falle el guardado
          }
        }
      }

      console.log(
        `💾 Guardadas ${savedEntries.length} nuevas entradas CON IMAGEN en caché para ${category}.`
      );
      return savedEntries; // Devuelve las entradas que se guardaron exitosamente
    } catch (error) {
      console.error(
        `❌ Error general al obtener y guardar entradas para ${category}:`,
        error
      );
      return []; // Devuelve array vacío en caso de error mayor
    }
  }

  // Devuelve la función de WikiQueries correspondiente a la categoría
  getCategoryQueryFunction(category) {
    const queryMap = {
      paises: WikiQueries.obtenerPaisYCapital,
      monumentos: WikiQueries.obtenerMonumentoYPais,
      elementos: WikiQueries.obtenerSimboloQuimico,
      peliculas: WikiQueries.obtenerPeliculaYDirector,
      canciones: WikiQueries.obtenerCancionYArtista,
      formula1: WikiQueries.obtenerAñoYGanadorF1,
      pinturas: WikiQueries.obtenerPintorYObras,
    };
    return queryMap[category];
  }

  // Verifica si la BD tiene un número mínimo de entradas para cada categoría
  async isDatabaseInitialized() {
    for (const category of this.categories) {
      // Comprueba si hay al menos un número razonable
      const count = await WikidataEntry.countDocuments({ category });
      const threshold = Math.min(50, this.minEntriesPerCategory); // Umbral mínimo
      if (count < threshold) {
        console.log(
          `⚠️ La categoría ${category} tiene solo ${count} entradas (necesita ~${threshold}). Se considera NO inicializada.`
        );
        return false; // Si una categoría no cumple, la BD no está inicializada
      }
    }
    return true; // Si todas las categorías cumplen, está inicializada
  }

  // Intenta llenar la BD hasta minEntriesPerCategory para cada categoría
  async initializeDatabase() {
    console.log(
      "🔄 Inicializando/Verificando base de datos de WikiData (asegurando entradas con imagen)..."
    );

    // Itera sobre cada categoría definida
    for (const category of this.categories) {
      const count = await WikidataEntry.countDocuments({ category });
      // Calcula cuántas entradas faltan para llegar al mínimo
      const neededEntries = Math.max(0, this.minEntriesPerCategory - count);

      if (neededEntries > 0) {
        console.log(
          `📚 Obteniendo hasta ${neededEntries} entradas NUEVAS CON IMAGEN para la categoría: ${category}...`
        );
        // Llama a fetchAndSaveEntries para obtener las entradas faltantes
        await this.fetchAndSaveEntries(category, neededEntries);
      } else {
        console.log(
          `✅ La categoría ${category} ya tiene suficientes entradas (${count}).`
        );
      }
    }

    console.log(
      "🏁 Inicialización/Verificación de la base de datos completada!"
    );
  }
}

module.exports = new WikidataCacheService();
