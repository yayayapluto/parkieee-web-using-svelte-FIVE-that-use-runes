import {redirect} from '@sveltejs/kit'
import type {PageServerLoad} from './$types'
import {ROLE_REDIRECT} from '$lib/utils/role'

export const load: PageServerLoad = ({locals}) => {
    if (locals.user) {
        throw redirect(302, ROLE_REDIRECT[locals.user.role] ?? '/')
    }
}
