import fs from 'fs';
import { BSON } from 'bson';

// Tipo per i documenti LiteDB BSON decodificati
type LiteDbDocument = Record<string, any>;

export async function parseLiteDB(filePath: string): Promise<void> {
  try {
    const data = await fs.promises.readFile(filePath);
    
    // Header LiteDB, tipicamente i primi 4096 byte
    const headerSize = 4096;
    // Inizio del parsing dei documenti BSON
    let offset = headerSize;
    while (offset < data.length) {
      // Lettura della lunghezza del documento BSON
      const docSize = data.readInt32LE(offset);
      const bsonDoc = data.slice(offset, offset + docSize);

      try {
        // Decodifica il documento BSON
        const document: LiteDbDocument = BSON.deserialize(bsonDoc);
        console.log("Documento BSON decodificato:", document);
      } catch (error) {
        console.error("Errore nel decodificare il documento BSON:", error);
      }

      offset += docSize;
    }
  } catch (err) {
    console.error("Errore nella lettura del file LiteDB:", err);
  }
}
