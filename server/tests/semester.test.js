const { currentSemester } = require('../src/utils/semester');

describe('currentSemester', () => {
  test.each([
    ['2026-10-14', '2026-1'], // HK1: tháng 8-12
    ['2026-08-01', '2026-1'],
    ['2026-12-31', '2026-1'],
    ['2027-01-15', '2026-1'], // HK1 kéo sang tháng 1
    ['2027-02-10', '2026-2'], // HK2: tháng 2-6
    ['2027-06-20', '2026-2'],
    ['2027-07-10', '2026-3'], // học hè: tháng 7
  ])('%s -> %s', (date, expected) => {
    expect(currentSemester(new Date(`${date}T12:00:00Z`))).toBe(expected);
  });

  test('luôn khớp định dạng schema YYYY-[1-3]', () => {
    for (let m = 0; m < 12; m += 1) expect(currentSemester(new Date(Date.UTC(2026, m, 15)))).toMatch(/^[0-9]{4}-[1-3]$/);
  });
});
