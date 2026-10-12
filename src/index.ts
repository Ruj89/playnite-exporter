import { backupAnalyzer, BackupAnalyzer } from './backupanalyzer';
import { CloudStorage, cloudStorage } from './cloudstorage';
import { Configuration, configuration, ConfigurationError } from './configuration';
import logger from './logger';

/** Main process */
async function main() {
  // Launch the configuration process
  Configuration.launch(logger);
  configuration?.logger.debug('Environment setup completed, starting the process');

  // Launch the storage process
  CloudStorage.launch(logger);

  // Check if processes are started correctly
  if (!cloudStorage) throw new Error('Cloud storage not started correctly');

  // List the last synchonized elements
  //const zipFiles = await cloudStorage.list();
  //const zipFilePath = await cloudStorage.download(zipFiles[0]);
  const zipFilePath = "/tmp/playnite-exporter-vOJhWJ/PlayniteBackup-2024-10-26-18-54-42.zip"
  BackupAnalyzer.launch(logger, zipFilePath);
  if (!backupAnalyzer) throw new Error('Backup analyzer not started correctly');
  await backupAnalyzer.analyze();
}

/** An error that needs to be throwed */
let unexpectedError: Error | undefined;
main()
  .catch((e) => {
    if (e instanceof ConfigurationError) logger.error(e.stack);
    else unexpectedError = <Error>e;
  })
  .finally(() => {
    if (unexpectedError) throw unexpectedError;
    process.exit();
  });
