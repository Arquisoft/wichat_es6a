// wikidataservice/models/wikidata-entry-model.js
import mongoose from 'mongoose';

const wikidataEntrySchema = new mongoose.Schema({
  // Campos comunes para todos los tipos de entradas
  category: {
    type: String,
    required: true,
    enum: ['paises', 'monumentos', 'elementos', 'peliculas', 'canciones', 'formula1', 'pinturas']
  },
  
  // Campos específicos para diferentes categorías
  // Estos campos serán opcionales ya que dependen de la categoría
  
  // Países
  countryLabel: String,
  capitalLabel: String,
  
  // Monumentos
  monumentLabel: String,
  
  // Elementos químicos
  elementLabel: String,
  symbol: String,
  
  // Películas
  peliculaLabel: String,
  directorLabel: String,
  
  // Canciones
  songLabel: String,
  artistLabel: String,
  
  // Formula 1
  year: String,
  winnerLabel: String,
  
  // Pinturas
  paintingLabel: String,
  
  // Campo para almacenar datos adicionales o metadatos
  rawData: {
    type: Object
  },
  
  // Fecha de creación
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice compuesto para búsquedas rápidas por categoría
wikidataEntrySchema.index({ category: 1, createdAt: -1 });

const WikidataEntry = mongoose.model('WikidataEntry', wikidataEntrySchema);

export default WikidataEntry;