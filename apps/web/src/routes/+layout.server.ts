import type {LayoutServerLoad} from './$types'

export const load: LayoutServerLoad = ({locals, cookies}) => {
    const token = cookies.get('parkiye_token') ?? null
    return {user: locals.user, token}
}
