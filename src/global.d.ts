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

  class Singleton {
    static with: (p: string[]) => string[];
  }
}

declare module 'bunyan-middleware' {
  function bunyanMiddleware(params: {
    headerName: string;
    level: string;
    logger: import('bunyan');
    logName: string;
    obscureHeaders: string[];
    propertyName: string;
  });
  export = bunyanMiddleware;
}

declare module 'nedb-core' {
  class Query {
    skip: (skip: number) => this;

    limit: (limit: number) => this;

    exec: <TResult>() => TResult[];
  }
  class Datastore {
    constructor(params: {
      autoload: boolean;
      filename: string;
      inMemoryOnly: boolean;
    });
    ensureIndex: (
      indexSpecification: import('mongodb').IndexSpecification,
    ) => void;

    find: (params: Record<string, unknown>) => Query;
  }
  export = Datastore;
}

declare module 'ec-key' {
  class ECKey {
    constructor(publicKey: string, type: 'pem');
    isPrivateECKey: boolean;
  }
  export = ECKey;
}
declare module 'node-rsa' {
  class NodeRSA {
    constructor(publicKey: string | { b: number });
    isPublic: () => boolean;

    exportKey: (format: string) => string;
  }
  export = NodeRSA;
}
declare module 'basic-auth-parser' {
  function AuthParser(param: string | undefined): {
    username: string;
    password: string;
  };
  export = AuthParser;
}

declare module 'binary-version-reader' {
  enum PlatformType {
    Core = 0,
    Photon = 6,
    P1 = 8,
    Electron = 10,
    Argon = 12,
    Boron = 13,
    Xenon = 14,
    RaspberryPI = 31,
    Duo = 88,
    Bluz = 103,
  }

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
  };
  type ModuleDependency = {
    s: number;
    l: 'm' | 'f';
    vc: number;
    vv: number;
    f: 'b' | 's' | 'u';
    n: string;
    v: number;
    d: ModuleSubDependency[];
  };
  type SystemInformation = {
    f: [];
    v: Record<string, number>;
    p: PlatformType;
    m: SystemModule;
  };

  class HalModuleParser {
    parseFile: (
      result: string,
      callback: (ret: FirmwareSetting) => void,
    ) => void;

    parseBuffer: (params: { fileBuffer: Buffer }) => Promise<FirmwareSetting>;
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
