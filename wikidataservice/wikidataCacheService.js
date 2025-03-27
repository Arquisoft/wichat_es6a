// wikidataservice/wikidataCacheService.js
import WikidataEntry from './models/wikidata-entry-model.js';
import WikiQueries from './wikidataQueries.js';

class WikidataCacheService {
  constructor() {
    this.minEntriesPerCategory = 500; // Mantener al menos este número de entradas por categoría
    this.categories = [
      'paises',
      'monumentos',
      'elementos',
      'peliculas',
      'canciones',
      'formula1',
      'pinturas'
    ];
  }

  /**
   * Obtiene entradas para una categoría específica desde la base de datos
   * @param {String} category - Categoría de las entradas
   * @param {Number} count - Número de entradas a obtener
   * @returns {Array} - Array de entradas
   */
  async getEntriesForCategory(category, count = 1) {
    try {
      // Intentar obtener entradas de la base de datos
      const entries = await WikidataEntry.find({ category })
        .sort({ createdAt: -1 })
        .limit(count);
      
      // Si hay suficientes entradas, retornarlas
      if (entries.length >= count) {
        return entries;
      }
      
      // Si no hay suficientes entradas, obtener nuevas y guardarlas
      const neededEntries = count - entries.length;
      const newEntries = await this.fetchAndSaveEntries(category, neededEntries);
      
      return [...entries, ...newEntries];
    } catch (error) {
      console.error(`Error al obtener entradas para la categoría ${category}:`, error);
      return [];
    }
  }

  /**
   * Obtiene una entrada aleatoria de la base de datos
   * @returns {Object} - Entrada aleatoria
   */
  async getRandomEntry() {
    try {
      // Obtener una categoría aleatoria
      const randomCategory = this.categories[Math.floor(Math.random() * this.categories.length)];
      
      // Contar entradas en esa categoría
      const count = await WikidataEntry.countDocuments({ category: randomCategory });
      console.log(`🔍 Categoría: ${randomCategory}, Entradas: ${count}`);
      
      if (count === 0) {
        // No hay entradas para esta categoría, obtener nuevas
        await this.fetchAndSaveEntries(randomCategory, this.minEntriesPerCategory);
        return this.getRandomEntry();
      }
      
      // Obtener una entrada aleatoria
      const random = Math.floor(Math.random() * count);
      const entry = await WikidataEntry.findOne({ category: randomCategory }).skip(random);
      console.log('Entrada aleatoria:', entry);
      
      return entry;
    } catch (error) {
      console.error('Error al obtener una entrada aleatoria:', error);
      return null;
    }
  }

  /**
   * Obtiene y guarda nuevas entradas de WikiData
   * @param {String} category - Categoría de las entradas
   * @param {Number} count - Número de entradas a obtener
   * @returns {Array} - Array de nuevas entradas
   */
  async fetchAndSaveEntries(category, count = 10) {
    try {
      // Obtener la función de consulta adecuada según la categoría
      const queryFunction = this.getCategoryQueryFunction(category);
      if (!queryFunction) {
        throw new Error(`Categoría no válida: ${category}`);
      }
      
      // Obtener datos de WikiData
      const wikidataEntries = await queryFunction();
      
      // Guardar entradas en la base de datos
      const savedEntries = [];
      
      for (let i = 0; i < Math.min(count, wikidataEntries.length); i++) {
        const wikidataEntry = wikidataEntries[i];
        
        // Crear un objeto con los campos relevantes según la categoría
        const entryData = {
          category,
          rawData: wikidataEntry // Guardar los datos originales para referencia
        };
        
        // Añadir campos específicos de la categoría
        switch (category) {
          case 'paises':
            entryData.countryLabel = wikidataEntry.countryLabel;
            entryData.capitalLabel = wikidataEntry.capitalLabel;
            break;
          case 'monumentos':
            entryData.monumentLabel = wikidataEntry.monumentLabel;
            entryData.countryLabel = wikidataEntry.countryLabel;
            break;
          case 'elementos':
            entryData.elementLabel = wikidataEntry.elementLabel;
            entryData.symbol = wikidataEntry.symbol;
            break;
          case 'peliculas':
            entryData.peliculaLabel = wikidataEntry.peliculaLabel;
            entryData.directorLabel = wikidataEntry.directorLabel;
            break;
          case 'canciones':
            entryData.songLabel = wikidataEntry.songLabel;
            entryData.artistLabel = wikidataEntry.artistLabel;
            break;
          case 'formula1':
            entryData.year = wikidataEntry.year;
            entryData.winnerLabel = wikidataEntry.winnerLabel;
            break;
          case 'pinturas':
            entryData.paintingLabel = wikidataEntry.paintingLabel;
            entryData.artistLabel = wikidataEntry.artistLabel;
            break;
        }
        
        // Guardar la entrada en la base de datos
        const newEntry = new WikidataEntry(entryData);
        await newEntry.save();
        savedEntries.push(newEntry);
      }
      
      return savedEntries;
    } catch (error) {
      console.error(`Error al obtener y guardar entradas para ${category}:`, error);
      return [];
    }
  }

  /**
   * Obtiene la función de consulta adecuada según la categoría
   * @param {String} category - Nombre de la categoría
   * @returns {Function} - Función de consulta de WikiData
   */
  getCategoryQueryFunction(category) {
    const queryMap = {
      'paises': WikiQueries.obtenerPaisYCapital,
      'monumentos': WikiQueries.obtenerMonumentoYPais,
      'elementos': WikiQueries.obtenerSimboloQuimico,
      'peliculas': WikiQueries.obtenerPeliculaYDirector,
      'canciones': WikiQueries.obtenerCancionYArtista,
      'formula1': WikiQueries.obtenerAñoYGanadorF1,
      'pinturas': WikiQueries.obtenerPintorYObras
    };
    
    return queryMap[category];
  }

  /**
   * Verificar si se han inicializado las entradas para todas las categorías
   * @returns {Boolean} - True si todas las categorías tienen entradas
   */
  async isDatabaseInitialized() {
    for (const category of this.categories) {
      const count = await WikidataEntry.countDocuments({ category });
      if (count < this.minEntriesPerCategory) {
        return false;
      }
    }
    return true;
  }

  /**
   * Inicializa la base de datos con entradas para todas las categorías
   */
  async initializeDatabase() {
    console.log('🔄 Inicializando base de datos de WikiData...');
    
    for (const category of this.categories) {
      const count = await WikidataEntry.countDocuments({ category });
      const neededEntries = Math.max(0, this.minEntriesPerCategory - count);
      
      if (neededEntries > 0) {
        console.log(`📚 Obteniendo ${neededEntries} entradas para la categoría: ${category}...`);
        await this.fetchAndSaveEntries(category, neededEntries);
      } else {
        console.log(`✅ La categoría ${category} ya tiene suficientes entradas.`);
      }
    }
    
    console.log('✅ Inicialización de la base de datos completada!');
  }
}

export default new WikidataCacheService();