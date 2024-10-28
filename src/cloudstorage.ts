import { Auth, drive_v3, google } from 'googleapis';
import winston from 'winston';
import * as keys from '../googleapi.json';
import { configuration } from './configuration';

interface CloudFile {
  filename: string
  date: Date
}

/** The cloud storage system */
export class CloudStorage {
  /** Authentication client */
  private client: Auth.JWT;
  /** Google drive client */
  private drive: drive_v3.Drive | undefined;

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
   * Extract the list of files in a Drive folder
   * @returns the array of string containing the name of the files
   */
  async list(): Promise<CloudFile[]> {
    await this.authorize();
    const response = await this.drive!.files.list({
      pageSize: 100,
      fields: 'nextPageToken, files(name, createdTime)',
      orderBy: 'createdTime desc',
      q: `trashed = false and '${configuration?.googleDrive.folderId!}' in parents`
    });
    const files = response.data.files;
    if (files?.length) {
      let result = files
        .map((file) => ({ filename: file.name!, date: new Date(file.createdTime!) }))
        .filter((file) => file.filename.startsWith(configuration?.googleDrive.fileNamePrefix!));
      this.logger.debug(`${[
        "Files:",
        ...result.map(f => `${f.filename} -> ${f.date}`)
      ].join("\n")}`);
      return result;
    } else {
      this.logger.debug('No files found.');
    }
    return [];
  }
}

/** The singleton instance to be initialized by the @see launch() method */
export let cloudStorage: CloudStorage | null;
