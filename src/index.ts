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
  const zipFiles = await cloudStorage.list();
  zipFiles.map(zipFile => zipFile)
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
