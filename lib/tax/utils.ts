export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundRate(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
