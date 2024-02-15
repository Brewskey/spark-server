/// <reference types="node" />
import bunyan from 'bunyan';
export default class Logger {
    static createLogger(applicationName: string): bunyan;
    static createModuleLogger(applicationModule: typeof module): bunyan;
}
