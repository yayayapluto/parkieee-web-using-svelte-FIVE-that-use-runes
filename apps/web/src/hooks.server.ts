import type {Handle} from '@sveltejs/kit'

function decodeJwt(token: string): Record<string, unknown> | null {
    try {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'))
    } catch {
        return null
    }
}

export const handle: Handle = async ({event, resolve}) => {
    const token = event.cookies.get('parkiye_token')

    if (token) {
        const payload = decodeJwt(token)
        if (payload) {
            const rawPerms = Array.isArray(payload.permissions) ? payload.permissions : []
            const permissions = rawPerms.map((p: unknown) =>
                typeof p === 'string' ? p : (p as Record<string, unknown>)?.node ?? ''
            ).filter(Boolean) as string[]

            const roleRaw = payload.role
            const role = typeof roleRaw === 'string'
                ? roleRaw
                : (roleRaw as Record<string, unknown>)?.name ?? ''

            event.locals.user = {
                id: (payload.sub ?? payload.user_id ?? '') as string,
                role: role as string,
                permissions,
            }
        } else {
            event.cookies.delete('parkiye_token', {path: '/'})
            event.locals.user = null
        }
    } else {
        event.locals.user = null
    }

    return resolve(event)
}
