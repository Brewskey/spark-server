// @flow

import fs from 'fs';
import Github from 'github';
import mkdirp from 'mkdirp';
import request from 'request';
import rmfr from 'rmfr';
import settings from '../src/settings';

type BinaryVerificationData = {
  downloadedBinaries: Array<string>,
  settingsBinaries: Array<string>,
};

const GITHUB_USER = 'spark';
const GITHUB_FIRMWARE_REPOSITORY = 'firmware';
const GITHUB_CLI_REPOSITORY = 'particle-cli';
const SPECIFICATIONS_FILE = `${settings.BINARIES_DIRECTORY}/specifications.js`;
const SETTINGS_FILE = `${settings.BINARIES_DIRECTORY}/settings.js`;

// This default is here so that the regex will work when updating these files.
/* eslint-disable */
const DEFAULT_SETTINGS = {
  knownApps: {
    'deep_update_2014_06': true,
    'cc3000': true,
    'cc3000_1_14': true,
    'tinker': true,
    'voodoo': true,
  },
  knownPlatforms: {
    '0': 'Core',
    '6': 'Photon',
    '8': 'P1',
    '10': 'Electron',
    '88': 'Duo',
    '103': 'Bluz',
  },
  updates: {
    '2b04:d006': {
      systemFirmwareOne: 'system-part1-0.6.0-photon.bin',
      systemFirmwareTwo: 'system-part2-0.6.0-photon.bin',
    },
    '2b04:d008': {
      systemFirmwareOne: 'system-part1-0.6.0-p1.bin',
      systemFirmwareTwo: 'system-part2-0.6.0-p1.bin',
    },
    '2b04:d00a': {
      // The bin files MUST be in this order to be flashed to the correct memory locations
      systemFirmwareOne: 'system-part2-0.6.0-electron.bin',
      systemFirmwareTwo: 'system-part3-0.6.0-electron.bin',
      systemFirmwareThree: 'system-part1-0.6.0-electron.bin',
    }
  },
};
/* eslint-enable */

const exitWithMessage = (message: string) => {
  console.log(message);
  process.exit(0);
};

const cleanBinariesDirectory = (): Promise<void> =>
  rmfr(settings.BINARIES_DIRECTORY);

const exitWithJSON = (json: Object): void =>
  exitWithMessage(JSON.stringify(json, null, 2));

const downloadFile = (url: string): Promise<string> =>
  new Promise((resolve: (filename: string) => void) => {
    const filename = url.match(/.*\/(.*)/)[1];
    console.log(`Downloading ${filename}...`);
    const fileStream = fs.createWriteStream(
      `${settings.BINARIES_DIRECTORY}/${filename}`,
    );
    fileStream.on(
      'finish',
      (): void => fileStream.close((): void => resolve(filename)),
    );
    request(url).pipe(fileStream).on('error', exitWithJSON);
  });


const downloadFirmwareBinaries = (assets: Array<Object>): Promise<Array<string>> =>
  Promise.all(
    assets.map((asset: Object): ?Promise<string> => {
      if (asset.name.match(/^system-part/)) {
        return downloadFile(asset.browser_download_url);
      }
      return null;
    }).filter((item: ?Promise<string>): Promise<string> => item),
  );


const updateSettings = (): Array<string> => {
  let versionNumber = versionTag;
  if (versionNumber[0] === 'v') {
    versionNumber = versionNumber.substr(1);
  }

  if (!fs.exists(SETTINGS_FILE)) {
    fs.writeFileSync(
      SETTINGS_FILE,
      `module.exports = ${JSON.stringify(DEFAULT_SETTINGS, null, 2)};`,
      { flag: 'wx' },
    );
  }

  let firmware = fs.readFileSync(SETTINGS_FILE, 'utf8');
  const settingsBinaries = [];

  firmware = firmware.replace(
    /(system-part\d-).*(-.*.bin)/g,
    (filename: string, part: string, device: string): string => {
      const newFilename = part + versionNumber + device;
      settingsBinaries.push(newFilename);
      return newFilename;
    },
  );

  fs.writeFileSync(SETTINGS_FILE, firmware, 'utf8');
  console.log('Updated settings.js');

  return settingsBinaries;
};

const verifyBinariesMatch = (data: BinaryVerificationData) => {
  const downloadedBinaries = data.downloadedBinaries.sort();
  const settingsBinaries = data.settingsBinaries.sort();

  if (JSON.stringify(downloadedBinaries) !== JSON.stringify(settingsBinaries)) {
    console.log(
      '\n\nWARNING: the list of downloaded binaries doesn\'t match the list ' +
      'of binaries in settings.js',
    );
    console.log(`Downloaded:  ${downloadedBinaries}`);
    console.log(`settings.js: ${settingsBinaries}`);
  }
};

const downloadAppBinaries = (): Promise<Array<string>> => {
  githubAPI.repos.getContent({
    owner: GITHUB_USER,
    path: 'binaries',
    repo: GITHUB_CLI_REPOSITORY,
  }).then((assets: Array<Object>): Promise<Array<string>> =>
    Promise.all(
      assets.map((asset: Object): Promise<string> =>
        downloadFile(asset.download_url),
      ),
    ),
  ).catch(console.log);
};

// Start running process. If you pass `0.6.0` it will install that version of
// the firmware.
let versionTag = process.argv[2];
if (versionTag && versionTag[0] !== 'v') {
  versionTag = `v${versionTag}`;
}

const githubAPI = new Github();

const clearBinariesPromise = cleanBinariesDirectory()
  .then(() => {
    if (!fs.existsSync(settings.BINARIES_DIRECTORY)) {
      mkdirp.sync(settings.BINARIES_DIRECTORY);
    }
  });

// Download known app binaries
const downloadKnownAppsPromise = clearBinariesPromise.then(
  (): Promise<Array<string>> => downloadAppBinaries(),
);

// Download firmware binaries
const downloadFirmwarePromise = clearBinariesPromise
  .then(
    (): Promise<void> => {
      if (process.argv.length === 3) {
        return Promise.Resolve();
      }

      return githubAPI.repos.getTags({
        owner: GITHUB_USER,
        page: 0,
        perPage: 30,
        repo: GITHUB_FIRMWARE_REPOSITORY,
      }).then((tags: Array<Object>) => {
        const filteredTags = tags.filter(
          (tag: Object): boolean =>
          !tag.name.includes('-rc') && !tag.name.includes('-pi'),
        );

        filteredTags.sort((a: Object, b: Object): number => {
          if (a.name < b.name) {
            return 1;
          }
          if (a.name > b.name) {
            return -1;
          }
          return 0;
        });

        versionTag = filteredTags[0].name;
      });
    },
  ).then((): Promise<Object> =>
    githubAPI.repos.getReleaseByTag({
      owner: GITHUB_USER,
      repo: GITHUB_FIRMWARE_REPOSITORY,
      tag: versionTag,
    }),
  );

downloadFirmwarePromise
  .then((release: Object): Promise<Array<string>> =>
    downloadFirmwareBinaries(release.assets))
  .then((downloadedBinaries: Array<string>): BinaryVerificationData => ({
    downloadedBinaries,
    settingsBinaries: updateSettings(),
  }))
  .then((binaryVerificationData: BinaryVerificationData): void =>
    verifyBinariesMatch(binaryVerificationData),
  );

const downloadSpecificationsPromise = githubAPI.repos.getContent({
  owner: GITHUB_USER,
  path: 'lib/deviceSpecs/specifications.js',
  repo: GITHUB_CLI_REPOSITORY,
}).then((response: Object) => {
  fs.writeFileSync(
    SPECIFICATIONS_FILE,
    new Buffer(response.content, 'base64').toString(),
    { flag: 'wx' },
  );
});

Promise.all([
  downloadFirmwarePromise,
  downloadKnownAppsPromise,
  downloadSpecificationsPromise,
]).then((): void => console.log('\r\nCompleted Sync'))
  .catch(console.log);
