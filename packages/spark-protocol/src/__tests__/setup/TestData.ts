import * as uuid from 'uuid';

const uuidSet = new Set();

class TestData {
  static getID(): string {
    let newID = uuid.v4().toLowerCase();
    while (uuidSet.has(newID)) {
      newID = uuid.v4().toLowerCase();
    }

    uuidSet.add(newID);
    return newID;
  }
}

export default TestData;
