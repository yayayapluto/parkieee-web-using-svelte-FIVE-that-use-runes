<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { getGateInfo } from '$lib/utils/auth'
  import { recordEntry } from '$lib/api/transactions'
  import { ArrowLeft, ScanLine, CreditCard, AlertCircle, Loader } from 'lucide-svelte'

  const gateId = $page.params.gate_id
  const gate   = getGateInfo()

  type Method = 'qr' | 'rfid' | null
  type Step   = 'select' | 'input' | 'loading' | 'error'

  let method    = $state<Method>(null)
  let step      = $state<Step>('select')
  let rfidInput = $state('')
  let qrInput   = $state('')
  let errorMsg  = $state('')
  let inputEl   = $state<HTMLInputElement | null>(null)

  $effect(() => {
    if (step === 'input' && inputEl) inputEl.focus()
  })

  let idleTimer: ReturnType<typeof setTimeout> | null = null

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => goto(`/kiosk/${gateId}`, { replaceState: true }), 60_000)
  }

  onMount(() => resetIdleTimer())
  onDestroy(() => { if (idleTimer) clearTimeout(idleTimer) })

  function selectMethod(m: Method) {
    method = m
    step = 'input'
    resetIdleTimer()
  }

  async function submit() {
    const value = method === 'rfid' ? rfidInput.trim() : qrInput.trim()
    if (!value || !gate) return

    step = 'loading'
    resetIdleTimer()

    try {
      const form = new FormData()
      form.append('entry_gate_id', gate.id)
      form.append('entry_method', method!)
      if (method === 'rfid') form.append('rfid_card_uid', value)

      const tx = await recordEntry(form)
      goto(`/kiosk/${gateId}/success?code=${tx.transaction_code}&type=entry`)
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan.'
      step = 'error'
      resetIdleTimer()
    }
  }

  function retry() {
    rfidInput = ''
    qrInput   = ''
    errorMsg  = ''
    step      = 'select'
    method    = null
    resetIdleTimer()
  }
</script>

<svelte:window onkeydown={() => resetIdleTimer()} onmousemove={() => resetIdleTimer()} />

<div class="flex h-screen flex-col bg-slate-950 text-white select-none">
  <div class="flex items-center gap-4 px-8 py-5 border-b border-slate-800">
    <button
      onclick={() => goto(`/kiosk/${gateId}`, { replaceState: true })}
      class="text-slate-500 hover:text-slate-300 transition-colors"
    >
      <ArrowLeft size={20} />
    </button>
    <div>
      <p class="text-xs text-slate-500 uppercase tracking-widest">Gerbang Masuk</p>
      <p class="text-sm font-semibold text-slate-300">{gate?.name}</p>
    </div>
  </div>

  <div class="flex flex-1 flex-col items-center justify-center gap-8 px-8">

    {#if step === 'select'}
      <p class="text-xl font-light text-slate-300">Pilih metode masuk</p>

      <div class="flex gap-6">
        <button
          onclick={() => selectMethod('qr')}
          class="flex h-44 w-44 flex-col items-center justify-center gap-4 rounded-xl
            border-2 border-slate-700 bg-slate-900 text-slate-400 transition-all
            hover:border-brand-500 hover:bg-slate-800 hover:text-white active:scale-95"
        >
          <ScanLine size={48} strokeWidth={1.25} />
          <span class="text-sm font-semibold">Scan QR</span>
        </button>

        <button
          onclick={() => selectMethod('rfid')}
          class="flex h-44 w-44 flex-col items-center justify-center gap-4 rounded-xl
            border-2 border-slate-700 bg-slate-900 text-slate-400 transition-all
            hover:border-brand-500 hover:bg-slate-800 hover:text-white active:scale-95"
        >
          <CreditCard size={48} strokeWidth={1.25} />
          <span class="text-sm font-semibold">Tap RFID</span>
        </button>
      </div>

    {:else if step === 'input'}
      {#if method === 'rfid'}
        <CreditCard size={56} strokeWidth={1} class="text-slate-600 animate-pulse" />
        <p class="text-xl font-light text-slate-300">Tempelkan kartu RFID</p>
        <input
          bind:this={inputEl}
          bind:value={rfidInput}
          onkeydown={(e) => { if (e.key === 'Enter') submit() }}
          class="absolute opacity-0 pointer-events-none"
          autocomplete="off"
        />
        {#if rfidInput}
          <p class="font-mono text-xs text-slate-500">{rfidInput}</p>
          <button
            onclick={submit}
            class="rounded-lg bg-brand-500 px-8 py-3 text-sm font-semibold
              hover:bg-brand-600 active:scale-95 transition-colors"
          >
            Konfirmasi
          </button>
        {/if}

      {:else}
        <ScanLine size={56} strokeWidth={1} class="text-slate-600" />
        <p class="text-xl font-light text-slate-300">Scan QR Code tiket</p>
        <div class="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
          <ScanLine size={16} class="text-slate-500 shrink-0" />
          <input
            bind:this={inputEl}
            bind:value={qrInput}
            onkeydown={(e) => { if (e.key === 'Enter') submit() }}
            placeholder="Atau ketik kode tiket..."
            class="bg-transparent text-sm text-slate-300 outline-none placeholder:text-slate-600 w-56"
          />
        </div>
        {#if qrInput.trim()}
          <button
            onclick={submit}
            class="rounded-lg bg-brand-500 px-8 py-3 text-sm font-semibold
              hover:bg-brand-600 active:scale-95 transition-colors"
          >
            Konfirmasi
          </button>
        {/if}
      {/if}

    {:else if step === 'loading'}
      <Loader size={40} strokeWidth={1.5} class="text-slate-500 animate-spin" />
      <p class="text-sm text-slate-400">Memproses...</p>

    {:else if step === 'error'}
      <AlertCircle size={48} strokeWidth={1.25} class="text-red-400" />
      <p class="text-lg font-semibold text-red-400">Gagal</p>
      <p class="text-sm text-slate-400 text-center max-w-xs">{errorMsg}</p>
      <div class="flex gap-4">
        <button
          onclick={retry}
          class="rounded-lg border border-slate-700 px-6 py-2.5 text-sm text-slate-300
            hover:bg-slate-800 active:scale-95"
        >
          Coba Lagi
        </button>
        <button
          onclick={() => goto(`/kiosk/${gateId}`, { replaceState: true })}
          class="rounded-lg border border-slate-700 px-6 py-2.5 text-sm text-slate-300
            hover:bg-slate-800 active:scale-95"
        >
          Kembali
        </button>
      </div>
    {/if}

  </div>
</div>
