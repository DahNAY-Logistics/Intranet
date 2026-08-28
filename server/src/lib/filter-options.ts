export interface FilterOptionCount {
  value: string;
  count: number;
}

export function toFilterOptions(counts: [value: string, count: number][]): FilterOptionCount[] {
  return counts.map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value));
}
