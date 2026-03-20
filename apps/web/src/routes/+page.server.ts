import {redirect} from '@sveltejs/kit'
import type {PageServerLoad} from './$types'
import {ROLE_REDIRECT} from '$lib/utils/role'

export const load: PageServerLoad = ({locals}) => {
    const user = locals.user
    if (!user) throw redirect(302, '/masuk')
    const dest = ROLE_REDIRECT[user.role] ?? '/masuk'
    throw redirect(302, dest)
}
