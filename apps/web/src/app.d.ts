// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
      interface Locals {
          user: {
              id: string
              role: string
              permissions: string[]
          } | null
      }

      interface PageData {
          token?: string | null
          user?: { id: string; role: string; permissions: string[] } | null
      }
  }
}

export {}
