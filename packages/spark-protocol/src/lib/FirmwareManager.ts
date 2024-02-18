import fs from 'fs';
import path from 'path';
import {
  HalDependencyResolver,
  HalDescribeParser,
  FirmwareModule,
  FirmwareSetting,
  SystemInformation,
  ModuleDependency,
  FirmwarePrefixInfo,
  ModuleSubDependency,
} from 'binary-version-reader';
import nullthrows from 'nullthrows';
import protocolSettings from '../settings';
import Logger from './logger';
const logger = Logger.createModuleLogger(module);
import { filterFalsyValues } from '../filterFalsyValues';

// eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires
const FirmwareSettings = require(
  path.join(
    protocolSettings.BINARIES_DIRECTORY,
    '../third-party/settings.json',
  ),
) as FirmwareSetting[];

const NUMBER_BY_FUNCTION = {
  b: 2,
  s: 4,
  u: 5,
} as const;
const FUNC_BY_NUMBER = {
  2: 'b',
  4: 's',
  5: 'u',
} as const;

export type OTAUpdate = {
  allModuleFunctions: ModuleDependency['f'][];
  allModuleIndices: Array<number>;
  systemFile: Buffer;
  allUpdateFiles: Array<string>;
};

class FirmwareManager {
  static async getMissingModules(
    systemInformation: SystemInformation,
  ): Promise<FirmwareSetting[] | null | undefined> {
    return FirmwareManager._getMissingModule(systemInformation);
  }

  static async getOtaSystemUpdateConfig(
    systemInformation: SystemInformation,
  ): Promise<OTAUpdate | null | undefined> {
    const missingDependencies =
      await FirmwareManager._getMissingModule(systemInformation);
    if (!missingDependencies?.length) {
      return null;
    }
    const { systemFiles, ...result } = missingDependencies.reduce(
      (acc, dependency) => {
        const dependencyPath = `${protocolSettings.BINARIES_DIRECTORY}/${dependency.filename}`;

        if (!fs.existsSync(dependencyPath)) {
          logger.error(
            {
              dependencyPath,
              dependency,
            },
            'Dependency does not exist on disk',
          );
          return acc;
        }

        const systemFile = fs.readFileSync(dependencyPath);
        return {
          allModuleFunctions: [
            ...acc.allModuleFunctions,
            FUNC_BY_NUMBER[dependency.prefixInfo.moduleFunction],
          ],
          allModuleIndices: [
            ...acc.allModuleIndices,
            dependency.prefixInfo.moduleIndex,
          ],
          systemFiles: [...acc.systemFiles, systemFile],
          allUpdateFiles: [...acc.allUpdateFiles, dependency.filename],
        };
      },
      {
        allModuleFunctions: [] as ModuleDependency['f'][],
        allModuleIndices: [] as number[],
        systemFiles: [] as Buffer[],
        allUpdateFiles: [] as string[],
      },
    );

    return {
      ...result,
      systemFile: systemFiles[0],
    };
  }

  static getAppModule(systemInformation: SystemInformation): FirmwareModule {
    const parser = new HalDescribeParser();
    return nullthrows(
      parser
        .getModules(systemInformation)
        // Filter so we only have the app modules
        .find((module: FirmwareModule): boolean => module.func === 'u'),
    );
  }

  static async _getMissingModule(
    systemInformation: SystemInformation,
  ): Promise<FirmwareSetting[] | null | undefined> {
    const platformID = systemInformation.p;

    // Fix 204 version deps. 204 doesn't exist so map it to 207
    systemInformation.m.forEach((moduleDependency: ModuleDependency) => {
      moduleDependency.d.forEach((subDependency: ModuleSubDependency) => {
        if (subDependency.v === 204) {
          subDependency.v = 207;
        }
      });
    });

    // find missing dependencies
    const dr = new HalDependencyResolver();
    const knownMissingDependencies =
      dr.findAnyMissingDependencies(systemInformation);

    if (!knownMissingDependencies.length) {
      return [];
    }

    const iter = 0;
    const findSettingForFirmwareModule = (
      dependency: FirmwareModule,
    ): FirmwareSetting | undefined => {
      return FirmwareSettings.find(
        ({ prefixInfo }: { prefixInfo: FirmwarePrefixInfo }): boolean =>
          prefixInfo.platformID === platformID &&
          prefixInfo.moduleVersion === dependency.version &&
          dependency.func != null &&
          prefixInfo.moduleFunction === NUMBER_BY_FUNCTION[dependency.func] &&
          prefixInfo.moduleIndex === parseInt(dependency.name, 10),
      );
    };

    const addRealDependencies = (
      dependency: FirmwareModule,
    ): FirmwareModule | null => {
      const setting = findSettingForFirmwareModule(dependency);
      if (!setting) {
        logger.error({
          msg: 'Cannot find firmware for module',
          systemInformation,
          dependency,
        });
        return null;
      }

      const result = new FirmwareModule({
        ...dependency.toDescribe(),
        d: [
          {
            f: FUNC_BY_NUMBER[setting.prefixInfo.depModuleFunction],
            n: setting.prefixInfo.depModuleIndex.toString(),
            v: setting.prefixInfo.depModuleVersion,
          },
          {
            f: FUNC_BY_NUMBER[setting.prefixInfo.dep2ModuleFunction],
            n: setting.prefixInfo.dep2ModuleIndex.toString(),
            v: setting.prefixInfo.dep2ModuleVersion,
          },
        ].filter(({ v }: ModuleSubDependency) => v !== 0),
      });
      result.filename = setting.filename;
      return result;
    };

    const allMissingDependencies = new Map<string, FirmwareModule>();
    const setDependency = (dep: FirmwareModule) => {
      const key = `${dep.func}#${dep.name}`;
      if (allMissingDependencies.has(key)) {
        const currentDep = allMissingDependencies.get(key);
        if (!currentDep || currentDep.version > dep.version) {
          return;
        }
      }

      allMissingDependencies.set(key, dep);
    };

    const results: FirmwareModule[] = knownMissingDependencies
      .map((dep) => addRealDependencies(new FirmwareModule(dep)))
      .filter(filterFalsyValues);

    results.forEach(setDependency);
    while (results.length) {
      const result = results.pop();
      const unmetDependencies: FirmwareModule[] = [];
      if (
        result &&
        !result.areDependenciesMet(systemInformation.m, unmetDependencies)
      ) {
        const settingsModules = unmetDependencies
          .map(addRealDependencies)
          .filter(filterFalsyValues);
        results.push(...settingsModules);
        settingsModules.forEach(setDependency);
      }
    }

    // Map dependencies to firmware metadata
    const knownMissingFirmwares: Array<FirmwareSetting> = Array.from(
      allMissingDependencies.values(),
    )
      .sort((a, b) => {
        if (a.func === 'b') {
          return 1;
        }
        return a.name.localeCompare(b.name);
      })
      .map((dep: FirmwareModule): FirmwareSetting | undefined => {
        const setting = findSettingForFirmwareModule(dep);

        if (!setting) {
          logger.error({ dep, platformID }, 'Missing firmware setting');
        }

        return setting;
      })
      .filter(filterFalsyValues);

    logger.info(
      {
        allFileNames: knownMissingFirmwares.map(
          (firmware) => firmware.filename,
        ),
      },
      'Discovering missing firmware',
    );

    return knownMissingFirmwares;
  }

  getKnownAppFileName(): string | null | undefined {
    throw new Error('getKnownAppFileName has not been implemented.');
  }
}

export default FirmwareManager;
