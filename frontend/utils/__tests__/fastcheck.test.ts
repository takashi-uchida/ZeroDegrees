import * as fc from 'fast-check';

describe('Fast-check Test', () => {
  test('simple property test', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        expect(n + 0).toBe(n);
      }),
      { numRuns: 10 }
    );
  });
});
