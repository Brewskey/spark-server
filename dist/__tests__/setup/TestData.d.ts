/// <reference types="node" />
import type { UserCredentials } from '../../types';
type CreateCustomFirmwareResult = {
    filePath: string;
    fileBuffer: Buffer;
};
declare class TestData {
    static createCustomFirmwareBinary: () => Promise<CreateCustomFirmwareResult>;
    static deleteCustomFirmwareBinary: (filePath: string) => Promise<void>;
    static getUser: () => UserCredentials;
    static getID: () => string;
    static getPublicKey: () => string;
}
export default TestData;
