# Playnite Exporter

An exporter that let you analyze the Playnite videogames library

## Install

Install the last stable NodeJS, clone this repo and

```bash
npm install
```

## Configuration

Setup the `.env` file following the `.env_template` file:

- **LOG_LEVEL**: the application log level.
- **GOOGLE_DRIVE_FOLDER**: the folder id where to store the files on Google Drive.
- **GOOGLE_DRIVE_FILE_PREFIX**: the file name prefixes.

Than create a service account, create the authentication key and save the JSON file `googleapi.json`. Give the service account the privileges to access the folder specified in the environment variable `GOOGLE_DRIVE_FOLDER`.

## Run

```bash
npm start
```

## Development

```bash
npm run development
```
