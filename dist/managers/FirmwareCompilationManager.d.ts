/// <reference types="node" />
export type CompilationResponse = {
    binary_id: string;
    errors?: Array<string>;
    expires_at: Date;
    sizeInfo: string;
};
declare class FirmwareCompilationManager {
    static firmwareDirectoryExists(): boolean;
    static getBinaryForID: (id: string) => Buffer | null | undefined;
    static compileSource: (platformID: string, files: Express.Multer.File[]) => Promise<CompilationResponse | null | undefined>;
    static addFirmwareCleanupTask(appFolderPath: string, config: CompilationResponse): void;
}
export default FirmwareCompilationManager;
