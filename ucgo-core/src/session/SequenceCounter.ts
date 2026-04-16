/**
 * Monotonic per-session sequence counter.
 * UCGO sequences are 1-indexed and increment per packet.
 */
export class SequenceCounter {
  private value: number;

  constructor(initial = 1) {
    this.value = initial;
  }

  /** Returns the current value then increments. */
  next(): number {
    return this.value++;
  }

  current(): number {
    return this.value;
  }

  reset(initial = 1): void {
    this.value = initial;
  }
}
