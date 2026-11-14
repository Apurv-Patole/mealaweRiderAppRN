/** One box of the code input: the digit shown (or empty) and whether it is the next to fill. */
export interface OtpCell {
  char: string;
  active: boolean;
}

/** Splits the typed code into `length` boxes. The active box is the next empty one (the last when full). */
export function otpCells(value: string, length: number): OtpCell[] {
  const activeIndex = Math.min(value.length, length - 1);
  return Array.from({ length }, (_, index) => ({
    char: value[index] ?? '',
    active: index === activeIndex,
  }));
}
