import {writable} from 'svelte/store'

export type NotifType = 'success' | 'error' | 'info'

export interface HelperNotif {
    id: string
    type: NotifType
    title: string
    description?: string
    actionLabel?: string
    onAction?: () => void
}

function createNotifStore() {
    const {subscribe, update} = writable<HelperNotif[]>([])

    function show(notif: Omit<HelperNotif, 'id'>, durationMs = 4000) {
        const id = crypto.randomUUID()
        update(n => [...n, {...notif, id}])
        setTimeout(() => dismiss(id), durationMs)
    }

    function dismiss(id: string) {
        update(n => n.filter(x => x.id !== id))
    }

    return {subscribe, show, dismiss}
}

export const helperNotif = createNotifStore()

export const notifSuccess = (title: string, description?: string, actionLabel?: string, onAction?: () => void) =>
    helperNotif.show({type: 'success', title, description, actionLabel, onAction})

export const notifError = (title: string, description?: string) =>
    helperNotif.show({type: 'error', title, description})

export const notifInfo = (title: string, description?: string, actionLabel?: string, onAction?: () => void) =>
    helperNotif.show({type: 'info', title, description, actionLabel, onAction})
