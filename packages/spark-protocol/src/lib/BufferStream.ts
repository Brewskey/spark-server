class BufferStream {
  _buffer: Buffer | null | undefined;

  _index: number = 0;

  constructor(buffer: Buffer) {
    this._buffer = buffer;
  }

  seek(index: number) {
    this._index = index;
  }

  read(size?: number): Buffer | null | undefined {
    if (!this._buffer) {
      return null;
    }

    const index = this._index;
    let endIndex = index + (size || 0);

    if (endIndex >= this._buffer.length) {
      endIndex = this._buffer.length;
    }

    let result = null;
    if (endIndex - index > 0) {
      result = this._buffer.slice(index, endIndex);
      this._index = endIndex;
    }

    return result;
  }

  close() {
    this._buffer = null;
  }
}

export default BufferStream;
