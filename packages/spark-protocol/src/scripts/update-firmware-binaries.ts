#! /usr/bin/env node

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../global.d.ts" />

import path from 'path';
import { Octokit } from '@octokit/rest';
import { mkdirp } from 'mkdirp';
import { FirmwareSetting, HalModuleParser } from 'binary-version-reader';
import dotenv from 'dotenv';
import settings from '../settings';
import fs from 'fs';
import { filterFalsyValues } from '../filterFalsyValues';
import { rejects } from 'assert';

let fileDirectory = path.resolve(__dirname);
let filePath = null;

// A counter is a lot safer than a while(true)
let count = 0;
while (count < 20) {
  count += 1;
  filePath = path.join(fileDirectory, '.env');
  console.log('Checking for .env: ', filePath);
  if (fs.existsSync(filePath)) {
    break;
  }

  const newFileDirectory = path.join(fileDirectory, '..');
  if (newFileDirectory === fileDirectory) {
    filePath = null;
    break;
  }
  fileDirectory = newFileDirectory;
}

if (!filePath) {
  dotenv.config();
} else {
  dotenv.config({
    path: filePath,
  });
}

const GITHUB_USER = 'particle-iot';
const GITHUB_FIRMWARE_REPOSITORY = 'firmware';
const GITHUB_CLI_REPOSITORY = 'particle-cli';
const FILE_GEN_DIRECTORY = path.join(
  settings.BINARIES_DIRECTORY,
  '../third-party/',
);
const SETTINGS_FILE = `${FILE_GEN_DIRECTORY}settings.json`;

const { GITHUB_AUTH_TOKEN } = process.env;

if (!GITHUB_AUTH_TOKEN) {
  throw new Error(
    'You need to set up a .env file with auth credentials (read public repos)',
  );
}

const githubAPI = new Octokit({
  auth: GITHUB_AUTH_TOKEN,
});

const downloadAssetFile = async (asset: {
  name: string;
  id: number;
}): Promise<string | null> => {
  const filename = asset.name;
  const fileWithPath = `${settings.BINARIES_DIRECTORY}/${filename}`;
  if (fs.existsSync(fileWithPath)) {
    console.log(`File Exists: ${filename}`);
    return filename;
  }

  console.log(`Downloading ${filename}...`);

  return githubAPI.rest.repos
    .getReleaseAsset({
      headers: {
        accept: 'application/octet-stream',
      },
      asset_id: asset.id,
      owner: GITHUB_USER,
      repo: GITHUB_FIRMWARE_REPOSITORY,
    })
    .then((response: unknown): string => {
      fs.writeFileSync(
        fileWithPath,
        Buffer.from((response as { data: ArrayBuffer }).data),
      );
      return filename;
    })
    .catch((error: Error): null => {
      console.error(`Could not download ${asset.name} -- ${error.message}`);
      return null;
    });
};

const downloadBlob = async (asset: {
  name: string;
  sha: string;
}): Promise<string | null> => {
  const filename = asset.name;
  const fileWithPath = `${settings.BINARIES_DIRECTORY}/${filename}`;
  if (fs.existsSync(fileWithPath)) {
    console.log(`File Exists: ${filename}`);
    return filename;
  }

  console.log(`Downloading ${filename}...`);

  return githubAPI.rest.git
    .getBlob({
      file_sha: asset.sha,
      headers: {
        accept: 'application/vnd.github.v3.raw',
      },
      owner: GITHUB_USER,
      repo: GITHUB_CLI_REPOSITORY,
    })
    .then((response: unknown): string => {
      fs.writeFileSync(
        fileWithPath,
        Buffer.from((response as { data: ArrayBuffer }).data),
      );
      return filename;
    })
    .catch((error: Error): null => {
      console.error(error);
      return null;
    });
};

const downloadFirmwareBinaries = async (
  assets: Array<{ id: number; name: string }>,
): Promise<Array<string>> => {
  const CHUNK_SIZE = 10;

  function chunkArray<TItem>(
    input: Array<TItem>,
    chunkSize: number,
  ): Array<Array<TItem>> {
    let index = 0;
    const arrayLength = input.length;
    const tempArray: TItem[][] = [];

    for (index = 0; index < arrayLength; index += chunkSize) {
      tempArray.push(input.slice(index, index + chunkSize));
    }

    return tempArray;
  }

  const chunks = chunkArray(
    assets.filter((asset): RegExpMatchArray | null =>
      asset.name.match(/(system-part|bootloader)/),
    ),
    CHUNK_SIZE,
  );

  const assetFileNames = await chunks.reduce(
    async (
      accumulator: Promise<string[]>,
      chunk: {
        id: number;
        name: string;
      }[],
    ): Promise<string[]> => {
      const files = await Promise.all(
        chunk.map((asset) => downloadAssetFile(asset)),
      );

      return [
        ...(await accumulator),
        ...(files.filter(filterFalsyValues) as unknown as string[]),
      ];
    },
    Promise.resolve([] as string[]),
  );

  return assetFileNames;
};

const updateSettings = async (binaryFileNames: Array<string>) => {
  const parser = new HalModuleParser();

  const moduleInfos = await Promise.all(
    binaryFileNames.map(
      (
        filename: string,
      ): Promise<FirmwareSetting & { fileBuffer: undefined }> =>
        new Promise(
          (
            resolve: (
              result: FirmwareSetting & { fileBuffer: undefined },
            ) => void,
            reject: (error: Error) => void,
          ) => {
            parser.parseFile(
              `${settings.BINARIES_DIRECTORY}/${filename}`,
              (result: FirmwareSetting, error: Error | undefined) => {
                if (error) {
                  console.error('Could not parse file', filename, error);
                  reject(error);
                  return;
                }
                // For some reason all the new modules are dependent on
                // version 204 but these modules don't actually exist
                // Use 207 as it's close enough (v0.7.0)
                // https://github.com/Brewskey/spark-protocol/issues/145
                if (result.prefixInfo.depModuleVersion === 204) {
                  // eslint-disable-next-line no-param-reassign
                  result.prefixInfo.depModuleVersion = 207;
                }

                resolve({
                  ...result,
                  fileBuffer: undefined,
                  filename,
                });
              },
            );
          },
        ),
    ),
  );

  const scriptSettings = JSON.stringify(moduleInfos, null, 2);

  fs.writeFileSync(SETTINGS_FILE, scriptSettings);
  console.log('Updated settings');
};

const downloadAppBinaries = async (): Promise<Array<string | null>> => {
  const paths = ['assets/knownApps'];
  const assetsToDownload = [];

  while (paths.length) {
    const currentPath = paths.pop();
    if (!currentPath) {
      break;
    }

    // eslint-disable-next-line no-await-in-loop
    const assets = await githubAPI.rest.repos.getContent({
      owner: GITHUB_USER,
      path: currentPath,
      repo: GITHUB_CLI_REPOSITORY,
    });

    const results = assets.data;
    if (Array.isArray(results)) {
      assetsToDownload.push(...results.filter((asset) => asset.type !== 'dir'));
      paths.push(
        ...results
          .filter((asset) => asset.type !== 'file')
          .map((asset) => asset.path),
      );
    }
  }

  return Promise.all(
    assetsToDownload.map(
      (asset): Promise<string | null> => downloadBlob(asset),
    ),
  );
};

(async (): Promise<void> => {
  try {
    if (!fs.existsSync(settings.BINARIES_DIRECTORY)) {
      mkdirp.sync(settings.BINARIES_DIRECTORY);
    }
    if (!fs.existsSync(FILE_GEN_DIRECTORY)) {
      mkdirp.sync(FILE_GEN_DIRECTORY);
    }

    try {
      // Download app binaries
      await downloadAppBinaries();
    } catch (error) {
      console.error(error);
    }

    // Download firmware binaries
    const releases = await githubAPI.paginate(
      githubAPI.rest.repos.listReleases,
      {
        owner: GITHUB_USER,
        repo: GITHUB_FIRMWARE_REPOSITORY,
      },
    );

    (releases as unknown as { published_at: number }[]).sort(
      (a, b): number => a.published_at - b.published_at,
    );

    const assets = releases.flatMap((release) => release.assets);

    const downloadedBinaries = await downloadFirmwareBinaries(assets);
    await updateSettings(downloadedBinaries);

    console.log('\r\nCompleted Sync');
  } catch (err) {
    console.error(err);
  }
})();
