// wikidataservice/models/wikidata-entry-model.js

const mongoose = require("mongoose");

const wikidataEntrySchema = new mongoose.Schema({
  // Campos comunes para todos los tipos de entradas
  category: {
    type: String,
    required: true,
    enum: [
      "paises",
      "monumentos",
      "elementos",
      "peliculas",
      "canciones",
      "formula1",
      "pinturas",
    ],
  },

  // Campos específicos para diferentes categorías

  // Países
  countryLabel: String,
  capitalLabel: String,

  // Monumentos
  monumentLabel: String,
  // countryLabel ya está definido (común a monumentos y países)

  // Elementos químicos
  elementLabel: String,
  symbol: String,

  // Películas
  peliculaLabel: String,
  directorLabel: String,

  // Canciones
  songLabel: String,
  artistLabel: String, // Usado también por pinturas

  // Formula 1
  year: String,
  winnerLabel: String,

  // Pinturas
  paintingLabel: String,
  // artistLabel ya está definido (usado también por canciones)

  imageUrl: {
    type: String, // Almacenará la URL de la imagen
    required: false, // Permitir entradas sin imagen si fuera necesario, aunque CacheService filtre
  },
  // ------------------------------------

  // Campo para almacenar datos originales o adicionales
  rawData: {
    type: Object,
  },

  // Fecha de creación
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Índice compuesto para búsquedas rápidas por categoría
wikidataEntrySchema.index({ category: 1, createdAt: -1 });

// Crear el modelo
const WikidataEntry = mongoose.model("WikidataEntry", wikidataEntrySchema);

module.exports = WikidataEntry;
