import {redirect} from '@sveltejs/kit'
import type {LayoutServerLoad} from './$types'

export const load: LayoutServerLoad = ({locals}) => {
    const user = locals.user
    if (!user || !user.permissions.includes('cashier.ability')) {
        throw redirect(302, '/masuk')
    }
    return {user}
}
