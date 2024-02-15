declare class SparkCoreMock {
    onApiMessage: () => boolean;
    getVariableValue: () => unknown;
    getDescription: () => {
        firmware_version: string;
        product_id: string;
        state: {
            f: null;
            v: null;
        };
    };
    ping: () => {
        connected: boolean;
        lastPing: Date;
    };
}
export default SparkCoreMock;
