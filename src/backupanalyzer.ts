import decompress from "decompress";
import winston from "winston";
import * as path from "path"
import { existsSync } from "fs";
import * as fs from "fs/promises";

/** The backup analyzer system */
export class BackupAnalyzer {
    /**
     *  Constructor
     *  @param logger the logger instance
     *  @param zipFile the path of the zip file
     */
    constructor(private logger: winston.Logger, private zipFile: string) {
    }

    /**
     * Initialize the singleton
     * @param logger the logger instance
    */
    static launch(logger: winston.Logger, zipFile: string) {
        backupAnalyzer = new BackupAnalyzer(logger, zipFile);
    }

    async analyze() {
        await this.decompress();
    }

    private async decompress() {
        const outputFolder = path.resolve(path.dirname(this.zipFile), "extract");
        if (existsSync(outputFolder))
            await fs.rm(outputFolder, { force: true, recursive: true });
        let files = await decompress(this.zipFile, outputFolder);
        this.logger.debug([
            "Extracted files:",
            ...files.map(file => file.path).map(filepath => `\t- ${path.resolve(outputFolder, filepath)}`)
        ].join("\n"))
    }
}

/** The singleton instance to be initialized by the @see launch() method */
export let backupAnalyzer: BackupAnalyzer | null;