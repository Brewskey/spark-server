declare module 'moniker' {
  class Generator {
    choose: () => string;
  }
  const adjective = 'adjective';
  const noun = 'noun';
  function generator(params: (adjective | noun)[]): Generator;
}
declare module 'ec-key' {
  class ECKey {
    constructor(key: string, keyType: 'pem');
    createSign(hash: string): Sign & {
      sign: (format?: BinaryToTextEncoding) => Buffer;
    };
    toString(format: string): string;
  }
  export = ECKey;
}
declare module 'constitute' {
  class Container {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bindMethod: <TFunc extends (...p: any[]) => unknown>(
      key: string,
      callback: TFunc,
      inject?: string[],
    ) => void;

    bindValue: (key: string, value: unknown) => void;

    // eslint-disable-next-line @typescript-eslint/ban-types
    bindAlias: (key1: string, clazz: Function) => void;

    // eslint-disable-next-line @typescript-eslint/ban-types
    bindClass: (key: string, clazz: Function, dependencies?: string[]) => void;

    constitute: <TType>(key: string) => TType;
  }
}
declare module 'binary-version-reader' {
  type ModuleFunction = 2 | 4 | 5;
  type FirmwarePrefixInfo = {
    moduleStartAddy: string;
    moduleEndAddy: string;
    reserved: number;
    moduleFlags: number;
    moduleVersion: number;
    platformID: number;
    moduleFunction: ModuleFunction;
    moduleIndex: number;
    depModuleFunction: ModuleFunction;
    depModuleIndex: number;
    depModuleVersion: number;
    dep2ModuleFunction: ModuleFunction;
    dep2ModuleIndex: number;
    dep2ModuleVersion: number;
    prefixOffset: number;
  };
  type FirmwareSetting = {
    filename: string;
    crc: {
      ok: boolean;
      storedCrc: string;
      actualCrc: string;
    };
    prefixInfo: FirmwarePrefixInfo;
    suffixInfo: {
      productId: number;
      productVersion: number;
      fwUniqueId: string;
      reserved: number;
      suffixSize: number;
      crcBlock: string;
    };
  };

  type ModuleSubDependency = {
    f: string;
    n: string;
    v: number;
    _?: string;
  };
  type ModuleDependency = {
    s: number;
    l: 'm' | 'f';
    vc: number;
    vv: number;
    u?: string;
    f?: 'b' | 's' | 'u';
    n?: string;
    v?: number;
    d: ModuleSubDependency[];
  };
  type SystemInformation = {
    f: [];
    v: Record<string, number>;
    p: PlatformType;
    m: ModuleDependency[];
  };

  class HalModuleParser {
    parseFile: (
      result: string,
      callback: (ret: FirmwareSetting, error: Error | undefined) => void,
    ) => void;
  }

  class HalDependencyResolver {
    findAnyMissingDependencies: (
      systemInformation: SystemInformation,
    ) => ModuleDependency[];
  }
  class HalDescribeParser {
    getModules: (systemInformation: SystemInformation) => FirmwareModule[];
  }
  class FirmwareModule {
    constructor(moduleDependency: ModuleDependency);
    hasIntegrity: () => boolean;

    toDescribe: () => ModuleDependency;

    areDependenciesMet: (
      systemModule: SystemModule,
      foo: FirmwareModule[],
    ) => boolean;

    func: ModuleDependency['f'];

    version: number;

    name: string;

    filename: string;

    uuid: string;
  }
}
