import {json, error} from '@sveltejs/kit'
import type {RequestHandler} from './$types'
import {PUBLIC_API_BASE_URL} from '$env/static/public'

export const POST: RequestHandler = async ({request, cookies}) => {
    const body = await request.json()

    let res: Response
    try {
        res = await fetch(`${PUBLIC_API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        })
    } catch {
        throw error(502, 'Tidak dapat terhubung ke server')
    }

    const data = await res.json()

    if (!res.ok) {
        const message = data?.meta?.message ?? 'Login gagal'
        throw error(res.status, message)
    }

    const token: string = data?.data?.token
    if (!token) throw error(500, 'Token tidak ditemukan di response')

    cookies.set('parkiye_token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
        maxAge: 60 * 60 * 24 * 7,
    })

    return json({user: data.data.user})
}
