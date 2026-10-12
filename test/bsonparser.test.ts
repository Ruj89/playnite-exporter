import { parseLiteDB } from "../src/bsonparser";

// Esempio di chiamata alla funzione con un file LiteDB
parseLiteDB("/tmp/playnite-exporter-vOJhWJ/extract/library/games.db").catch(console.error);