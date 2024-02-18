import {Transform} from 'stream';

class NetworkThrottleStream extends Transform {
  _millisecondDelay: number;

  constructor(millisecondDelay: number) {
    super();

    this._millisecondDelay = millisecondDelay;
  }

  _transform = (
    chunk: Buffer | string,
    encoding: string,
    callback: any,
  ) => {
    const action = () => {
      this.push(chunk);
      callback();
    };
    if (!this._millisecondDelay) {
      action();
      return;
    }

    setTimeout(action, this._millisecondDelay);
  }
}

export default NetworkThrottleStream;
