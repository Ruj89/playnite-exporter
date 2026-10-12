import * as fs from "fs/promises";
import * as fsStream from "fs";
import * as stream from 'stream';
import { Auth, drive_v3, google } from 'googleapis';
import * as os from 'os';
import * as path from 'path';
import winston from 'winston';
import * as keys from '../googleapi.json';
import * as util from "util"
import { configuration } from './configuration';

interface CloudFile {
  id: string
  filename: string
  date: Date
}

/** The cloud storage system */
export class CloudStorage {
  /** Authentication client */
  private client: Auth.JWT;
  /** Google drive client */
  private drive: drive_v3.Drive | undefined;
  // Field to store the path of the temporary folder created by createTempFolder
  private tempFolderPath: string | null = null;

  /**
   *  Constructor
   *  @param logger the logger instance
   */
  constructor(private logger: winston.Logger) {
    this.client = new google.auth.JWT(keys.client_email, undefined, keys.private_key, [
      'https://www.googleapis.com/auth/drive'
    ]);
  }

  /**
   * Initialize the singleton
   * @param logger the logger instance
  */
  static launch(logger: winston.Logger) {
    cloudStorage = new CloudStorage(logger);
  }

  /**
   * Execute an authorization, if needed, and generate an instance of a client
   */
  private async authorize(): Promise<void> {
    if (this.drive) return;
    await this.client.authorize();
    this.drive = google.drive({ version: 'v3', auth: this.client });
  }

  /**
   * Creates a temporary folder in the system's temp directory.
   * The path to this temporary folder is stored in the `tempFolderPath` field.
   *
   * @returns {Promise<void>} A promise that resolves when the temporary folder is successfully created.
   */
  private async createTempFolder(): Promise<void> {
    if (this.tempFolderPath != null)
      return;
    try {
      // Crea una cartella temporanea con un prefisso specifico
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'playnite-exporter-'));
      // Salva il path della cartella temporanea nel field
      this.tempFolderPath = tempDir;
      this.logger.debug(`Temp folder created at: ${this.tempFolderPath}`);
    } catch (error) {
      this.logger.error("Failed to create temp folder", error);
    }
  }


  /**
   * Extract the list of files in a Drive folder
   * @returns the array of string containing the name of the files
   */
  async list(): Promise<CloudFile[]> {
    await this.authorize();
    const response = await this.drive!.files.list({
      pageSize: 100,
      fields: 'nextPageToken, files(id, name, createdTime)',
      orderBy: 'createdTime desc',
      q: `trashed = false and '${configuration?.googleDrive.folderId!}' in parents`
    });
    const files = response.data.files;
    if (files?.length) {
      let result = files
        .map((file) => ({ filename: file.name!, date: new Date(file.createdTime!), id: file.id! }))
        .filter((file) => file.filename.startsWith(configuration?.googleDrive.fileNamePrefix!));
      this.logger.debug(`${[
        "Files:",
        ...result.map(f => `\t${f.filename} -> ${f.date}`)
      ].join("\n")}`);
      return result;
    } else {
      this.logger.debug('No files found.');
    }
    return [];
  }
  /**
   * Download a file from Google Drive
   * @param fileId the ID of the file to download
   * @param destinationPath the local path where the file will be saved
   */
  async download(file: CloudFile): Promise<string> {
    await this.authorize();
    await this.createTempFolder();

    const destinationPath = path.resolve(this.tempFolderPath!, file.filename);
    const dest = fsStream.createWriteStream(destinationPath);

    try {
      const response = await this.drive!.files.get(
        { fileId: file.id, alt: 'media' },
        { responseType: 'stream' }
      );

      // Promisify the stream piping process
      const pipeline = util.promisify(stream.pipeline);
      await pipeline(response.data, dest);

      this.logger.info(`Downloaded file to ${destinationPath}`);
    } catch (error: any) {
      this.logger.error(`Failed to download file: ${error.message}`);
    }
    
    return destinationPath;
  }
}

/** The singleton instance to be initialized by the @see launch() method */
export let cloudStorage: CloudStorage | null;
