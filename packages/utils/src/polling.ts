export function createPoller(fn: () => Promise<void>, intervalMs: number, immediate = true) {
  let timer: ReturnType<typeof setInterval> | null = null
  return {
    start() {
      if (timer) return
      if (immediate) fn()
      timer = setInterval(fn, intervalMs)
    },
    stop() {
      if (timer) { clearInterval(timer); timer = null }
    },
  }
}
