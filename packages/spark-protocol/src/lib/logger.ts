import bunyan from 'bunyan';
import path from 'path';
import settings from '../settings';

export default class Logger {
  static createLogger(applicationName: string): bunyan {
    return bunyan.createLogger({
      level: settings.LOG_LEVEL,
      name: applicationName,
      serializers: bunyan.stdSerializers,
    });
  }

  static createModuleLogger<TOtherProps extends Record<string, unknown>>(
    applicationModule: NodeModule,
    otherProps?: TOtherProps,
  ): bunyan {
    return bunyan.createLogger({
      level: settings.LOG_LEVEL,
      name: path.basename(applicationModule.filename),
      serializers: bunyan.stdSerializers,
      ...(otherProps ?? {}),
    });
  }
}
