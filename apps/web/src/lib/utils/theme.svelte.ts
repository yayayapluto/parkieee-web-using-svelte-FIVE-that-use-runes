export type Theme = 'light' | 'dark' | 'system'

function createTheme() {
  let current = $state<Theme>(
    (typeof localStorage !== 'undefined' ? (localStorage.getItem('theme') as Theme) : null) ?? 'system'
  )

  function apply(t: Theme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = t === 'dark' || (t === 'system' && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
  }

  function set(t: Theme) {
    current = t
    localStorage.setItem('theme', t)
    apply(t)
  }

  function init() {
    apply(current)
    // Listen to system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (current === 'system') apply('system')
    })
  }

  return {
    get current() { return current },
    set,
    init,
  }
}

export const theme = createTheme()
