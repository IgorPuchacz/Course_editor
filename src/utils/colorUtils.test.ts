import {
  hexToRgb,
  channelToLinear,
  getReadableTextColor,
  lightenColor,
  darkenColor,
  surfaceColor,
} from './colorUtils.js';

type TestFn = () => void;
interface TestCase {
  name: string;
  fn: TestFn;
}

const tests: TestCase[] = [];

const test = (name: string, fn: TestFn) => {
  tests.push({ name, fn });
};

const isNumber = (value: unknown): value is number => typeof value === 'number';

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(key => deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }
  return false;
};

const expect = (actual: unknown) => ({
  toEqual(expected: unknown) {
    if (!deepEqual(actual, expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  },
  toBe(expected: unknown) {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
    }
  },
  toBeNull() {
    if (actual !== null) {
      throw new Error(`Expected ${JSON.stringify(actual)} to be null`);
    }
  },
  toBeCloseTo(expected: number, epsilon = 1e-6) {
    if (!isNumber(actual)) {
      throw new Error(`Expected a number but received ${JSON.stringify(actual)}`);
    }
    if (Math.abs(actual - expected) > epsilon) {
      throw new Error(`Expected ${actual} to be within ${epsilon} of ${expected}`);
    }
  },
});

test('hexToRgb converts six digit hex colors to rgb values', () => {
  expect(hexToRgb('#336699')).toEqual({ r: 51, g: 102, b: 153 });
});

test('hexToRgb expands shorthand hex colors', () => {
  expect(hexToRgb('#0af')).toEqual({ r: 0, g: 170, b: 255 });
});

test('hexToRgb returns null for invalid input', () => {
  expect(hexToRgb('#zzzzzz')).toBeNull();
  expect(hexToRgb('')).toBeNull();
});

test('channelToLinear converts low values using the linear segment', () => {
  expect(channelToLinear(5)).toBeCloseTo(5 / (255 * 12.92));
});

test('channelToLinear converts higher values using the exponential segment', () => {
  const expected = Math.pow(((200 / 255) + 0.055) / 1.055, 2.4);
  expect(channelToLinear(200)).toBeCloseTo(expected);
});

test('getReadableTextColor returns dark text for light backgrounds', () => {
  expect(getReadableTextColor('#ffffff')).toBe('#0f172a');
});

test('getReadableTextColor returns light text for dark backgrounds', () => {
  expect(getReadableTextColor('#000000')).toBe('#f8fafc');
});

test('getReadableTextColor falls back to dark text when hex is invalid', () => {
  expect(getReadableTextColor('#xyzxyz')).toBe('#0f172a');
});

test('lightenColor lightens rgb channels towards white', () => {
  expect(lightenColor('#000000', 0.5)).toBe('rgb(128, 128, 128)');
  expect(lightenColor('#123456', 1)).toBe('rgb(255, 255, 255)');
});

test('lightenColor returns original string when conversion fails', () => {
  expect(lightenColor('invalid', 0.3)).toBe('invalid');
});

test('darkenColor darkens rgb channels towards black', () => {
  expect(darkenColor('#ffffff', 0.5)).toBe('rgb(128, 128, 128)');
  expect(darkenColor('#123456', 1)).toBe('rgb(0, 0, 0)');
});

test('darkenColor returns original string when conversion fails', () => {
  expect(darkenColor('invalid', 0.3)).toBe('invalid');
});

test('surfaceColor uses lightenColor when text is dark', () => {
  expect(surfaceColor('#000000', '#0f172a', 0.25, 0.5)).toBe('rgb(64, 64, 64)');
});

test('surfaceColor uses darkenColor when text is light', () => {
  expect(surfaceColor('#ffffff', '#f8fafc', 0.25, 0.5)).toBe('rgb(128, 128, 128)');
});

let failures = 0;

tests.forEach(({ name, fn }) => {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
});

if (failures > 0) {
  const globalProcess = (globalThis as { process?: { exitCode?: number } }).process;
  if (globalProcess) {
    globalProcess.exitCode = 1;
  }
}
