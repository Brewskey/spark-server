import { getDatabaseConfigFromEnv } from '../lib/getDatabaseConfigFromEnv';

describe('getDatabaseConfigFromEnv', () => {
  it('should parse a deeply nested object', () => {
    const data = {
      DATABASE__FOO__BAR_A: '1',
      DATABASE__FOO__BAR_B: '2',
      DATABASE__FOO__BAR__GG: '3',
      DATABASE__OTHER__BAR__GG: '4',
      DATABASE__OTHER__BAR_GGG_EEEE_FFFFF: '5',
    };

    expect(getDatabaseConfigFromEnv(data)).toMatchObject({
      foo: {
        barA: '1',
        barB: '2',
        bar: {
          gg: '3',
        },
      },
      other: {
        bar: {
          gg: '4',
        },
        barGggEeeeFffff: '5',
      },
    });
  });
});
