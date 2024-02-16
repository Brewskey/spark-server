import sinon from 'sinon';
import FirmwareManager from '../lib/FirmwareManager';
import { SystemInformation } from 'binary-version-reader';

describe('FirmwareManager', () => {
  test('should subscribe to event', async () => {
    const SYSTEM: SystemInformation = {
      f: [],
      v: {},
      p: 8,
      m: [
        {
          s: 16384,
          l: 'm',
          vc: 30,
          vv: 30,
          f: 'b',
          n: '0',
          v: 11,
          d: [],
        },
        {
          s: 262144,
          l: 'm',
          vc: 30,
          vv: 30,
          f: 's',
          n: '1',
          v: 109,
          d: [],
        },
        {
          s: 262144,
          l: 'm',
          vc: 30,
          vv: 30,
          f: 's',
          n: '2',
          v: 109,
          d: [
            {
              f: 's',
              n: '1',
              v: 109,
              _: '',
            },
          ],
        },
        {
          s: 131072,
          l: 'm',
          vc: 30,
          vv: 26,
          u: '9AA9B022074E20643188FEC98EB2FEE61E72BB6B5BEDDEAAACB77070E7CFCE3C',
          f: 'u',
          n: '1',
          v: 5,
          d: [
            {
              f: 's',
              n: '2',
              v: 1002,
              _: '',
            },
          ],
        },
        {
          s: 131072,
          l: 'f',
          vc: 30,
          vv: 0,
          d: [],
        },
      ],
    };

    const result = await FirmwareManager.getOtaSystemUpdateConfig(SYSTEM);
    expect(result).toBeNull();
  });

  test('should get updates for really messed up system info', async () => {
    const BAD_DEVICE_THAT_WONT_UPDATE: SystemInformation = {
      f: [],
      v: {},
      p: 6,
      m: [
        {
          s: 16384,
          l: 'm',
          vc: 30,
          vv: 30,
          f: 'b',
          n: '0',
          v: 1003,
          d: [],
        },
        {
          s: 262144,
          l: 'm',
          vc: 30,
          vv: 30,
          f: 's',
          n: '1',
          v: 2008,
          d: [
            {
              f: 's',
              n: '2',
              v: 207,
              _: '',
            },
          ],
        },
        {
          s: 262144,
          l: 'm',
          vc: 30,
          vv: 28,
          f: 's',
          n: '2',
          v: 2008,
          d: [
            {
              f: 's',
              n: '1',
              v: 2008,
              _: '',
            },
            {
              f: 'b',
              n: '0',
              v: 1003,
              _: '',
            },
          ],
        },
        {
          s: 131072,
          l: 'm',
          vc: 30,
          vv: 30,
          u: '27AB07E6ABA1F2CE920BEC14DC118D430DF89DE833766C8AF6D4EAE4C05CF22D',
          f: 'u',
          n: '1',
          v: 6,
          d: [
            {
              f: 's',
              n: '2',
              v: 2008,
              _: '',
            },
          ],
        },
      ],
    };

    const result = await FirmwareManager.getOtaSystemUpdateConfig(
      BAD_DEVICE_THAT_WONT_UPDATE,
    );
    expect(result).toMatchObject({
      allModuleFunctions: ['s'],
      allModuleIndices: [2],
      allUpdateFiles: ['photon-system-part2@2.0.0.bin'],
    });
  });
});
