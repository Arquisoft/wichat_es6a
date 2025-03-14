import { consulta } from './wikidataConnection.js';

class WikiQueries {
    static regExp = /^Q\d+$/;

    static async obtenerPaisYCapital() {
        const query = `
            SELECT ?countryLabel ?capitalLabel WHERE {
                ?country wdt:P31 wd:Q6256.
                ?country wdt:P36 ?capital.
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
            }
        `;
        return consulta(query);
    }

    static async obtenerMonumentoYPais() {
        const query = `
            SELECT ?monumentLabel ?countryLabel WHERE {
                ?monument wdt:P31 wd:Q570116; wdt:P17 ?country.
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
            } 
        `;
        return consulta(query);
    }

    static async obtenerSimboloQuimico() {
        const query = `
            SELECT ?elementLabel ?symbol WHERE { 
                ?element wdt:P31 wd:Q11344. 
                ?element wdt:P246 ?symbol. 
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
            }
        `;
        return consulta(query);
    }

    static async obtenerPeliculaYDirector() {
        const query = `
            SELECT ?peliculaLabel ?directorLabel WHERE {
                ?pelicula wdt:P31 wd:Q11424.
                ?pelicula wdt:P57 ?director.
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
            }
        `;
        return consulta(query);
    }

    static async obtenerCancionYArtista() {
        const query = `
            SELECT ?songLabel ?artistLabel WHERE {
                ?song wdt:P31 wd:Q7366;
                      wdt:P175 ?artist.
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
            }
        `;
        return consulta(query);
    }

    static async obtenerAñoYGanadorF1() {
        const query = `
            SELECT ?year ?winnerLabel WHERE {
                wd:Q1968 wdt:P793 ?event.
                ?event wdt:P585 ?date.
                ?event wdt:P1346 ?winner.
                BIND(YEAR(?date) AS ?year)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
            }
        `;
        return consulta(query);
    }

    static async obtenerPintorYObras() {
        const query = `
            SELECT ?paintingLabel ?artistLabel WHERE {
                ?painting wdt:P31 wd:Q3305213;
                          wdt:P170 ?artist.
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
            }
        `;
        return consulta(query);
    }
}

export {WikiQueries};
export default WikiQueries;
