export function createPoller(fn: () => Promise<void>, intervalMs: number) {
  let timer: ReturnType<typeof setInterval> | null = null
  return {
    start() {
      if (timer) return
      timer = setInterval(fn, intervalMs)
    },
    stop() {
      if (timer) { clearInterval(timer); timer = null }
    },
  }
}
