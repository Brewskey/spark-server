import fs from 'fs';
import os from 'os';
import path from 'path';
import { FirmwareSetting, SystemInformation } from 'binary-version-reader';
import FirmwareManager from '../lib/FirmwareManager';

const MOCK_SETTINGS_PATH = path.join(
  __dirname,
  '..',
  '..',
  'fixtures',
  'minimal-firmware-settings.json',
);

describe('FirmwareManager', () => {
  let testRoot: string;

  beforeAll(() => {
    const settings = JSON.parse(
      fs.readFileSync(MOCK_SETTINGS_PATH, 'utf8'),
    ) as FirmwareSetting[];
    testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-fw-test-'));
    const binariesDir = path.join(testRoot, 'binaries');
    fs.mkdirSync(binariesDir, { recursive: true });
    for (const { filename } of settings) {
      fs.writeFileSync(path.join(binariesDir, filename), '');
    }
    FirmwareManager.initialize(binariesDir, settings);
  });

  afterAll(() => {
    fs.rmSync(testRoot, { recursive: true, force: true });
  });

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
    expect(result).toMatchObject({
      allModuleFunctions: ['s', 's', 'b'],
      allModuleIndices: [1, 2, 0],
      allUpdateFiles: [
        'system-part1-1.0.1-p1.bin',
        'system-part2-1.0.1-p1.bin',
        'bootloader-1.0.1-p1.bin',
      ],
      currentModulesFiles: [
        'bootloader-0.6.2-p1.bin',
        'system-part1-0.6.3-p1.bin',
        'system-part2-0.6.3-p1.bin',
      ],
    });
  });

  test('should not get any updates', async () => {
    const NO_UPDATES_FOR_DEVICE: SystemInformation = {
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
      NO_UPDATES_FOR_DEVICE,
    );
    expect(result).toBeNull();
  });

  test('should find updates for firmware', async () => {
    const BAD_DEVICE_THAT_WONT_UPDATE: SystemInformation = {
      f: [],
      v: {},
      p: 8,
      m: [
        { s: 16384, l: 'm', vc: 30, vv: 30, f: 'b', n: '0', v: 1100, d: [] },
        { s: 262144, l: 'm', vc: 30, vv: 30, f: 's', n: '1', v: 207, d: [] },
        {
          s: 262144,
          l: 'm',
          vc: 30,
          vv: 30,
          f: 's',
          n: '2',
          v: 207,
          d: [
            { f: 's', n: '1', v: 207, _: '' },
            { f: 'b', n: '0', v: 101, _: '' },
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
          d: [{ f: 's', n: '2', v: 1002, _: '' }],
        },
        { s: 131072, l: 'f', vc: 30, vv: 0, d: [] },
      ],
    };

    const result = await FirmwareManager.getOtaSystemUpdateConfig(
      BAD_DEVICE_THAT_WONT_UPDATE,
    );

    expect(result).toMatchObject({
      allModuleFunctions: ['s', 's'],
      allModuleIndices: [1, 2],
      allUpdateFiles: [
        'system-part1-1.0.1-p1.bin',
        'system-part2-1.0.1-p1.bin',
      ],
      currentModulesFiles: [
        'p1-bootloader@3.3.1+lto.bin',
        'system-part1-0.7.0-p1.bin',
        'system-part2-0.7.0-p1.bin',
      ],
    });
  });

  it('should work for 2.3.1', async () => {
    const BAD_DEVICE_THAT_WONT_UPDATE: SystemInformation = {
      f: [],
      v: {},
      p: 8,
      m: [
        { s: 16384, l: 'm', vc: 30, vv: 30, f: 'b', n: '0', v: 501, d: [] },
        {
          s: 262144,
          l: 'm',
          vc: 30,
          vv: 30,
          f: 's',
          n: '1',
          v: 1406,
          d: [{ f: 's', n: '2', v: 207, _: '' }],
        },
        {
          s: 262144,
          l: 'm',
          vc: 30,
          vv: 30,
          f: 's',
          n: '2',
          v: 1406,
          d: [
            { f: 's', n: '1', v: 1406, _: '' },
            { f: 'b', n: '0', v: 400, _: '' },
          ],
        },
        {
          s: 131072,
          l: 'm',
          vc: 30,
          vv: 26,
          u: '99703CDF1C6D6C6ABCAB382D9EC6EBE0167FB2B9507B5DF521A822E1956EA8FA',
          f: 'u',
          n: '1',
          v: 6,
          d: [{ f: 's', n: '2', v: 2302, _: '' }],
        },
      ],
    };
    const result = await FirmwareManager.getOtaSystemUpdateConfig(
      BAD_DEVICE_THAT_WONT_UPDATE,
    );

    expect(result).toMatchObject({
      allModuleFunctions: ['s', 's', 'b'],
      allModuleIndices: [1, 2, 0],
      allUpdateFiles: [
        'p1-system-part1@2.3.1.bin',
        'p1-system-part2@2.3.1.bin',
        'p1-bootloader@2.0.0-rc.3+lto.bin',
      ],
      currentModulesFiles: [
        'p1-bootloader@1.5.1+lto.bin',
        'p1-system-part1@1.4.4.bin',
        'p1-system-part2@1.4.4.bin',
      ],
    });
  });
});
