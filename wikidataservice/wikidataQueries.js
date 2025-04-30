const { consulta } = require("./wikidataConnection");

class WikiQueries {
  static async obtenerPaisYCapital() {
    const query = `
              SELECT ?countryLabel ?capitalLabel ?image WHERE { # <-- Añadido ?image
                  ?country wdt:P31 wd:Q6256.
                  ?country wdt:P36 ?capital.
                  # Intentamos obtener la imagen de la CAPITAL
                  OPTIONAL { ?capital wdt:P18 ?image . } # <-- Añadido OPTIONAL para imagen P18 de la capital
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". } # Añadido 'en' como fallback
              }
              LIMIT 500
          `;
    return consulta(query);
  }

  static async obtenerMonumentoYPais() {
    const query = `
              SELECT ?monumentLabel ?countryLabel ?image WHERE { # <-- Añadido ?image
                  ?monument wdt:P31 wd:Q570116; # Podrías usar un tipo más general como wd:Q4989906 (monument) si Q570116 es muy específico
                            wdt:P17 ?country.
                  # Intentamos obtener la imagen del MONUMENTO
                  OPTIONAL { ?monument wdt:P18 ?image . } # <-- Añadido OPTIONAL para imagen P18 del monumento
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". } # Añadido 'en' como fallback
              }
              LIMIT 500
          `;
    return consulta(query);
  }

  static async obtenerSimboloQuimico() {
    const query = `
              SELECT ?elementLabel ?symbol ?image WHERE { # <-- Añadido ?image
                  ?element wdt:P31 wd:Q11344.
                  ?element wdt:P246 ?symbol.
                  # Intentamos obtener la imagen del ELEMENTO (puede ser menos común)
                  OPTIONAL { ?element wdt:P18 ?image . } # <-- Añadido OPTIONAL para imagen P18 del elemento
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". } # Añadido 'en' como fallback
              }
              LIMIT 500
          `;
    return consulta(query);
  }

  static async obtenerPeliculaYDirector() {
    const query = `
              SELECT ?peliculaLabel ?directorLabel ?image WHERE { # <-- Añadido ?image
                  ?pelicula wdt:P31 wd:Q11424.
                  ?pelicula wdt:P57 ?director.
                  # Intentamos obtener la imagen de la PELICULA (poster u otra imagen)
                  OPTIONAL { ?pelicula wdt:P18 ?image . } # <-- Añadido OPTIONAL para imagen P18 de la película
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". } # Añadido 'en' como fallback
              }
              LIMIT 500
          `;
    return consulta(query);
  }

  static async obtenerCancionYArtista() {
    const query = `
              SELECT ?songLabel ?artistLabel ?image WHERE { # <-- Añadido ?image
                  ?song wdt:P31 wd:Q7366;     # Instancia de Canción
                        wdt:P175 ?artist. # Intérprete
                  # Intentamos obtener imagen de la CANCIÓN (menos probable) o del ARTISTA?
                  # Probemos con la canción primero, si no, se podría intentar con ?artist wdt:P18 ?image.
                  OPTIONAL { ?song wdt:P18 ?image . } # <-- Añadido OPTIONAL para imagen P18 de la canción
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". } # Añadido 'en' como fallback
              }
              LIMIT 500
          `;
    return consulta(query);
  }

  static async obtenerAñoYGanadorF1() {
    const query = `
              SELECT ?year ?winnerLabel ?image WHERE { # <-- Añadido ?image
                  wd:Q1968 wdt:P793 ?event.     # Evento parte del campeonato mundial F1
                  ?event wdt:P585 ?date.        # Fecha del evento
                  ?event wdt:P1346 ?winner.     # Ganador del evento
                  BIND(YEAR(?date) AS ?year)
                  # Intentamos obtener imagen del EVENTO (ej: temporada del campeonato)
                  OPTIONAL { ?event wdt:P18 ?image . } # <-- Añadido OPTIONAL para imagen P18 del evento
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". } # Añadido 'en' como fallback
              }
              LIMIT 500
          `;
    return consulta(query);
  }

  static async obtenerPintorYObras() {
    const query = `
              SELECT ?paintingLabel ?artistLabel ?image WHERE { # <-- Añadido ?image
                  ?painting wdt:P31 wd:Q3305213; # Instancia de pintura
                            wdt:P170 ?artist.  # Creador (artista)
                  # Intentamos obtener la imagen de la PINTURA
                  OPTIONAL { ?painting wdt:P18 ?image . } # <-- Añadido OPTIONAL para imagen P18 de la pintura
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". } # Añadido 'en' como fallback
              }
              LIMIT 500
          `;
    return consulta(query);
  }
}

module.exports = WikiQueries;
