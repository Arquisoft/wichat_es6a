// wikidataservice/wikidataCacheService.js
import WikidataEntry from "./models/wikidata-entry-model.js";
import WikiQueries from "./wikidataQueries.js";

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

      // If not enough, fetch existing and try to add more needed ones
      const existingEntries = await WikidataEntry.find({ category });
      const neededEntries = count - existingEntries.length;

      if (neededEntries > 0) {
        console.log(
          `Trying to fetch ${neededEntries} new entries with images for ${category} as cache is low.`
        );
        const newEntries = await this.fetchAndSaveEntries(
          category,
          neededEntries
        );
        return [...existingEntries, ...newEntries].slice(0, count); // Combine and ensure max count
      } else {
        return existingEntries; // Return existing if somehow count was met or less than 0 needed
      }
    } catch (error) {
      console.error(
        `Error al obtener entradas para la categoría ${category}:`,
        error
      );
      return [];
    }
  }

  async getRandomEntry() {
    try {
      const randomCategory =
        this.categories[Math.floor(Math.random() * this.categories.length)];

      const count = await WikidataEntry.countDocuments({
        category: randomCategory,
      });

      if (count === 0) {
        console.log(
          `No entries found for ${randomCategory}, attempting to fetch...`
        );
        // Attempt to fetch minimum entries if cache is empty for this category
        await this.fetchAndSaveEntries(
          randomCategory,
          this.minEntriesPerCategory // Try fetching enough to meet minimum requirement
        );
        // Try getting a random entry again after attempting fetch
        const newCount = await WikidataEntry.countDocuments({
          category: randomCategory,
        });
        if (newCount === 0) {
          console.error(
            `Still no entries for ${randomCategory} after fetch attempt.`
          );
          return null; // Give up if still none
        }
        const random = Math.floor(Math.random() * newCount);
        const entry = await WikidataEntry.findOne({
          category: randomCategory,
        }).skip(random);
        return entry;
      } else {
        // Get a random entry from existing ones
        const random = Math.floor(Math.random() * count);
        const entry = await WikidataEntry.findOne({
          category: randomCategory,
        }).skip(random);
        return entry;
      }
    } catch (error) {
      console.error("Error al obtener una entrada aleatoria:", error);
      return null;
    }
  }

  async fetchAndSaveEntries(category, count = 10) {
    try {
      const queryFunction = this.getCategoryQueryFunction(category);
      if (!queryFunction) {
        throw new Error(`Categoría no válida: ${category}`);
      }

      // Fetch raw data (potentially more than 'count' to find enough with images)
      // Consider increasing LIMIT in WikiQueries if needed
      const wikidataEntries = await queryFunction();
      console.log(
        `🔍 Obtenidas ${
          wikidataEntries?.length || 0
        } entradas crudas de WikiQueries para ${category}. Buscando ${count} con imagen...`
      );

      const savedEntries = [];
      if (!wikidataEntries || wikidataEntries.length === 0) {
        console.warn(
          `No se obtuvieron entradas de WikiQueries para ${category}.`
        );
        return savedEntries;
      }

      let savedCount = 0;
      // Iterate through fetched entries until we save 'count' entries WITH images, or run out of source entries
      for (let i = 0; i < wikidataEntries.length && savedCount < count; i++) {
        const wikidataEntry = wikidataEntries[i];

        // --- GUARDAR SOLO SI TIENE IMAGEN ---
        if (wikidataEntry && wikidataEntry.image) {
          const entryData = {
            category,
            rawData: wikidataEntry,
            imageUrl: wikidataEntry.image, // Assign the valid URL
          };

          // Add specific fields (optional, keeps structure consistent if needed)
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
            // Save entry ONLY if it has an image
            const newEntry = new WikidataEntry(entryData);
            await newEntry.save();
            savedEntries.push(newEntry);
            savedCount++; // Increment only when an entry with image is saved
          } catch (saveError) {
            console.error(
              `Error guardando entrada (${category}) con imagen: ${saveError.message}`,
              entryData
            );
            // Continue to next entry if save fails
          }
        }
      }

      console.log(
        `Guardadas ${savedEntries.length} nuevas entradas CON IMAGEN en caché para ${category}.`
      );
      return savedEntries;
    } catch (error) {
      console.error(
        `Error al obtener y guardar entradas para ${category}:`,
        error
      );
      return [];
    }
  }

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

  async isDatabaseInitialized() {
    for (const category of this.categories) {
      // Check if there's at least a reasonable number, not necessarily the full amount
      // This prevents constant re-fetching if only a few items lack images
      const count = await WikidataEntry.countDocuments({ category });
      if (count < Math.min(50, this.minEntriesPerCategory)) {
        // Check for at least 50 (or minEntries, whichever is smaller)
        console.log(
          `Category ${category} has only ${count} entries (needs ~50). Initializing.`
        );
        return false;
      }
    }
    return true;
  }

  async initializeDatabase() {
    console.log(
      "Inicializando base de datos de WikiData (asegurando entradas con imagen)..."
    );

    for (const category of this.categories) {
      const count = await WikidataEntry.countDocuments({ category });
      // Aim to reach minEntriesPerCategory, fetch in batches if needed
      const neededEntries = Math.max(0, this.minEntriesPerCategory - count);

      if (neededEntries > 0) {
        console.log(
          `📚 Obteniendo hasta ${neededEntries} entradas NUEVAS CON IMAGEN para la categoría: ${category}...`
        );
        // Fetch potentially more than needed raw to find enough with images
        // Let's fetch a bit more than strictly needed to increase chances
        await this.fetchAndSaveEntries(category, neededEntries);
      } else {
        console.log(
          `La categoría ${category} ya tiene suficientes entradas.`
        );
      }
    }

    console.log(
      "Inicialización/Verificación de la base de datos completada!"
    );
  }
}

export default new WikidataCacheService();
