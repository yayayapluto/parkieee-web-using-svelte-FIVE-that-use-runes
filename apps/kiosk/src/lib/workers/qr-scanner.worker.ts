import jsQR from 'jsqr'

declare const self: Worker

self.onmessage = (e: MessageEvent<{ data: Uint8ClampedArray; width: number; height: number }>) => {
  const { data, width, height } = e.data
  const result = jsQR(data, width, height)
  self.postMessage(result ? result.data : null)
}
