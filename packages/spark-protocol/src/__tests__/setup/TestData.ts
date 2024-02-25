import * as uuid from 'uuid';

const uuidSet = new Set();
let iter = 0;

class TestData {
  static getID(): string {
    let newID = uuid.v4().toLowerCase();
    while (uuidSet.has(newID)) {
      newID = uuid.v4().toLowerCase();
    }

    uuidSet.add(newID);
    return newID;
  }

  static getNumericID(): number {
    iter += 1;
    return iter;
  }
}

export default TestData;
