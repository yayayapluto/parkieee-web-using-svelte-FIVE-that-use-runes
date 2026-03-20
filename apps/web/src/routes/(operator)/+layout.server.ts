import {redirect} from '@sveltejs/kit'
import type {LayoutServerLoad} from './$types'

const ALLOWED = ['operator', 'admin']

export const load: LayoutServerLoad = ({locals}) => {
    const user = locals.user
    if (!user || !ALLOWED.includes(user.role)) {
        throw redirect(302, '/masuk')
    }
    return {user}
}
