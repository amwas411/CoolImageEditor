export function clamp(a, b, c) {
  return Math.min(Math.max(a, b), c);
}

export function createDebounced(fn, ms) {
  let timer;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.call();
    }, ms);
  }
}