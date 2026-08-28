export function monthDateRange(month: string): { gte: Date; lte: Date } {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];

  return {
    gte: new Date(Date.UTC(year, monthNumber - 1, 1)),
    lte: new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999)),
  };
}
