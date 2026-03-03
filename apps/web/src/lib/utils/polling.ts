export function createPoller(fn: () => Promise<void>, intervalMs: number) {
  let timer: ReturnType<typeof setInterval> | null = null
  return {
    start() {
      fn()
      timer = setInterval(fn, intervalMs)
    },
    stop() {
      if (timer) clearInterval(timer)
    },
  }
}
