let isThrottled = false
const THROTTLE_MS = 250

export function mouseThrottle(): void {
  document.addEventListener(
    'mousemove',
    (e) => {
      if (isThrottled) {
        e.stopImmediatePropagation()
        return
      }

      isThrottled = true
      setTimeout(() => {
        isThrottled = false
      }, THROTTLE_MS)
    },
    { capture: true, passive: true }
  )

  document.body.style.cursor = 'default'
}
