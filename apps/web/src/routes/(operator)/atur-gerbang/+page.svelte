<script lang="ts">
  import { onMount } from 'svelte'
  import { getZones, listGates, updateGate } from '$lib/api/zones'
  import { getPairingInfo, confirmPairing } from '$lib/api/gates'
  import { getRole } from '$lib/utils/auth'
  import { formatDateTime } from '$lib/utils/format'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Separator } from '$lib/components/ui/separator'
  import * as Dialog from '$lib/components/ui/dialog'
  import * as AlertDialog from '$lib/components/ui/alert-dialog'
  import * as Select from '$lib/components/ui/select'
  import { RefreshCw, ArrowDownToLine, ArrowUpFromLine, DoorOpen, DoorClosed, QrCode, Loader2, SquareArrowOutUpRight } from 'lucide-svelte'
  import { toastError, toastSuccess } from '$lib/components/ui/toast'
  import type { Zone } from '$lib/types/domain'
  import type { PairingInfoResponse } from '$lib/types/domain'
  import DataTable from './data-table/data-table.svelte'
  import type { GateRow } from './data-table/columns'

  let zones = $state<Zone[]>([])
  let gates = $state<GateRow[]>([])
  let totalGates = $state(0)
  let loading = $state(false)
  let initialLoaded = $state(false)

  let statsTotal = $state(0)
  let statsActive = $state(0)
  let statsEntry = $state(0)
  let statsExit = $state(0)
  const canManage = ['admin', 'owner', 'engineer'].includes(getRole() ?? '')
  const canPairing = true

  let filterZone = $state('')
  let filterType = $state('')
  let filterStatus = $state('')
  let search = $state('')
  let page = $state(1)
  let pageSize = $state(20)

  let selectedGate = $state<GateRow | null>(null)
  let detailOpen = $state(false)

  let toggleGate = $state<GateRow | null>(null)
  let toggleLoading = $state(false)

  let pairingGate = $state<GateRow | null>(null)
  let pairingOpen = $state(false)
  let pairingCode = $state('')
  let pairingInfo = $state<PairingInfoResponse | null>(null)
  let pairingInfoLoading = $state(false)
  let pairingInfoError = $state('')
  let pairingConfirmLoading = $state(false)
  let pairingConfirmError = $state('')
  let pairingSuccess = $state(false)

  let videoEl = $state<HTMLVideoElement | null>(null)
  let canvasEl = $state<HTMLCanvasElement | null>(null)
  let scanActive = $state(false)
  let scanError = $state('')
  let stream: MediaStream | null = null
  let animFrameId: number | null = null

  let searchDebounce: ReturnType<typeof setTimeout>

  async function fetchGates(p: number, ps: number, fZone: string, fType: string, fStatus: string, q: string) {
    loading = true
    try {
      const params: Parameters<typeof listGates>[0] = { page: p, page_size: ps }
      if (fZone) params.zone_id = fZone
      if (fType) params.gate_type = fType as 'entry' | 'exit'
      if (fStatus === 'active') params.active = true
      else if (fStatus === 'inactive') params.active = false

      const gatesRes = await listGates(params)
      const raw = gatesRes.data ?? []
      gates = q.trim() ? raw.filter(g => g.name.toLowerCase().includes(q.toLowerCase())) : raw
      totalGates = gatesRes.pagination.meta.total
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Gagal memuat data gerbang')
    } finally {
      loading = false
      initialLoaded = true
    }
  }

  async function fetchZones() {
    try {
      const res = await getZones({ page_size: 100 })
      zones = res.data ?? []
    } catch { /* non-fatal */ }
  }

  async function fetchStats() {
    try {
      const [all, active, entry, exit] = await Promise.all([
        listGates({ page: 1, page_size: 1 }),
        listGates({ page: 1, page_size: 1, active: true }),
        listGates({ page: 1, page_size: 1, gate_type: 'entry' }),
        listGates({ page: 1, page_size: 1, gate_type: 'exit' }),
      ])
      statsTotal = all.pagination.meta.total
      statsActive = active.pagination.meta.total
      statsEntry = entry.pagination.meta.total
      statsExit = exit.pagination.meta.total
    } catch { /* non-fatal */ }
  }

  function onSearchChange() {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
      page = 1
      fetchGates(1, pageSize, filterZone, filterType, filterStatus, search)
    }, 350)
  }

  $effect(() => {
    const fz = filterZone, ft = filterType, fs = filterStatus, p = page, ps = pageSize
    fetchGates(p, ps, fz, ft, fs, search)
  })



  function openDetail(gate: GateRow) {
    selectedGate = gate
    detailOpen = true
  }

  onMount(() => { fetchZones(); fetchStats() })

  function openToggle(gate: GateRow) {
    toggleGate = gate
  }

  async function doToggle() {
    if (!toggleGate) return
    toggleLoading = true
    const target = toggleGate
    try {
      await updateGate(target.zone_id, target.id, { is_active: !target.is_active })
      gates = gates.map(g => g.id === target.id ? { ...g, is_active: !target.is_active } : g)
      toastSuccess(`Gate ${target.name} berhasil ${target.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      toggleGate = null
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Gagal mengubah status gate')
    } finally {
      toggleLoading = false
    }
  }

  function openPairing(gate: GateRow) {
    pairingGate = gate
    pairingOpen = true
    pairingCode = ''
    pairingInfo = null
    pairingInfoError = ''
    pairingConfirmError = ''
    pairingSuccess = false
  }

  async function fetchPairingInfo() {
    if (pairingCode.trim().length !== 6) return
    pairingInfoLoading = true
    pairingInfoError = ''
    pairingInfo = null
    try {
      pairingInfo = await getPairingInfo(pairingCode.trim().toUpperCase())
    } catch (e) {
      pairingInfoError = e instanceof Error ? e.message : 'Kode tidak ditemukan — pastikan kode 6 karakter dari layar device'
    } finally {
      pairingInfoLoading = false
    }
  }

  async function startScanner() {
    scanError = ''
    scanActive = true
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      })
      if (videoEl) {
        videoEl.srcObject = stream
        await videoEl.play()
        scanFrame()
      }
    } catch {
      scanError = 'Tidak bisa akses kamera. Pastikan izin kamera sudah diberikan.'
      scanActive = false
    }
  }

  function stopScanner() {
    if (animFrameId) cancelAnimationFrame(animFrameId)
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
    scanActive = false
    animFrameId = null
  }

  async function scanFrame() {
    if (!videoEl || !canvasEl || !scanActive) return
    if (videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) {
      animFrameId = requestAnimationFrame(scanFrame)
      return
    }
    const ctx = canvasEl.getContext('2d')
    if (!ctx) return
    canvasEl.width = videoEl.videoWidth
    canvasEl.height = videoEl.videoHeight
    ctx.drawImage(videoEl, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height)
    const jsQR = (await import('jsqr')).default
    const result = jsQR(imageData.data, imageData.width, imageData.height)
    if (result) {
      stopScanner()
      handleQRResult(result.data)
      return
    }
    animFrameId = requestAnimationFrame(scanFrame)
  }

  function handleQRResult(raw: string) {
    try {
      const parsed = JSON.parse(raw)
      const url: string = parsed.url ?? ''
      const match = url.match(/\/pair\/([A-Z0-9]{6})$/i)
      if (match) {
        pairingCode = match[1].toUpperCase()
        fetchPairingInfo()
      } else {
        pairingInfoError = 'QR tidak valid — bukan QR pairing gate.'
      }
    } catch {
      pairingInfoError = 'QR tidak bisa dibaca.'
    }
  }

  async function doConfirmPairing() {
    if (!pairingGate || !pairingInfo) return
    pairingConfirmLoading = true
    pairingConfirmError = ''
    try {
      await confirmPairing(pairingInfo.code, pairingGate.id)
      pairingSuccess = true
    } catch (e) {
      pairingConfirmError = e instanceof Error ? e.message : 'Gagal konfirmasi pairing'
      toastError(pairingConfirmError)
    } finally {
      pairingConfirmLoading = false
    }
  }

  function closePairing() {
    stopScanner()
    pairingOpen = false
    fetchGates(page, pageSize, filterZone, filterType, filterStatus, search)
  }
</script>

<div class="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">

  <!-- Header -->
  <div class="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
    <div class="flex items-baseline gap-2">
      <h1 class="text-[15px] font-semibold text-gray-900">Gerbang</h1>
      {#if initialLoaded}
        <span class="text-[12px] text-gray-400">({totalGates} gerbang)</span>
      {/if}
    </div>
    <Button variant="outline" class="h-9 gap-1.5 px-3 text-[13px] text-gray-600" onclick={() => fetchGates(page, pageSize, filterZone, filterType, filterStatus, search)} disabled={loading}>
      <RefreshCw size={13} class={loading ? 'animate-spin' : ''} />
      Refresh
    </Button>
  </div>

  <!-- Stats cards -->
  <div class="grid flex-shrink-0 grid-cols-2 gap-3 border-b border-gray-100 p-3 xl:grid-cols-4">
    <div class="flex flex-col gap-0.5 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <span class="text-[11px] text-gray-400">Total Gerbang</span>
      <span class="text-[22px] font-semibold text-gray-900">{statsTotal}</span>
    </div>
    <button
      class="group relative flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-left {filterStatus === 'active' ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50'}"
      onclick={() => { filterStatus = filterStatus === 'active' ? '' : 'active'; page = 1 }}
    >
      <SquareArrowOutUpRight size={15} class="absolute right-2.5 top-2.5 text-gray-300" />
      <span class="text-[11px] text-gray-400">Aktif</span>
      <span class="text-[22px] font-semibold text-gray-900">{statsActive}</span>
    </button>
    <button
      class="group relative flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-left {filterType === 'entry' ? 'border-green-300 bg-green-50' : 'border-gray-100 bg-gray-50'}"
      onclick={() => { filterType = filterType === 'entry' ? '' : 'entry'; page = 1 }}
    >
      <SquareArrowOutUpRight size={15} class="absolute right-2.5 top-2.5 text-gray-300" />
      <span class="text-[11px] text-gray-400">Entry</span>
      <span class="text-[22px] font-semibold text-gray-900">{statsEntry}</span>
    </button>
    <button
      class="group relative flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-left {filterType === 'exit' ? 'border-orange-300 bg-orange-50' : 'border-gray-100 bg-gray-50'}"
      onclick={() => { filterType = filterType === 'exit' ? '' : 'exit'; page = 1 }}
    >
      <SquareArrowOutUpRight size={15} class="absolute right-2.5 top-2.5 text-gray-300" />
      <span class="text-[11px] text-gray-400">Exit</span>
      <span class="text-[22px] font-semibold text-gray-900">{statsExit}</span>
    </button>
  </div>

  <!-- Filter bar -->
  <div class="flex flex-shrink-0 flex-col gap-2 border-b border-gray-100 px-4 py-3 xl:flex-row xl:items-center xl:gap-4">
    <!-- Search -->
    <div class="relative w-full xl:w-48 xl:flex-shrink-0">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <Input type="text" placeholder="Cari nama..." bind:value={search} oninput={onSearchChange} class="w-full pl-8 text-[13px]" autofocus />
    </div>

    <!-- Filters -->
    <div class="flex w-full flex-wrap items-center gap-2 xl:flex-1 xl:flex-nowrap xl:gap-3">
      <Select.Root type="single" bind:value={filterZone}>
        <Select.Trigger class="flex-1 text-[13px]">
          {zones.find(z => z.id === filterZone)?.name ?? 'Semua Zona'}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="">Semua Zona</Select.Item>
          {#each zones as z}
            <Select.Item value={z.id}>{z.name}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>

      <Select.Root type="single" bind:value={filterType}>
        <Select.Trigger class="flex-1 text-[13px]">
          {filterType === 'entry' ? 'Entry' : filterType === 'exit' ? 'Exit' : 'Semua Tipe'}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="">Semua Tipe</Select.Item>
          <Select.Item value="entry">Entry</Select.Item>
          <Select.Item value="exit">Exit</Select.Item>
        </Select.Content>
      </Select.Root>

      <Select.Root type="single" bind:value={filterStatus}>
        <Select.Trigger class="flex-1 text-[13px]">
          {filterStatus === 'active' ? 'Aktif' : filterStatus === 'inactive' ? 'Nonaktif' : 'Semua Status'}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="">Semua Status</Select.Item>
          <Select.Item value="active">Aktif</Select.Item>
          <Select.Item value="inactive">Nonaktif</Select.Item>
        </Select.Content>
      </Select.Root>
    </div>

    <!-- Reset -->
    <div class="flex items-center xl:w-48 xl:flex-shrink-0 xl:justify-end">
      {#if filterZone || filterType || filterStatus || search}
        <Button variant="outline" class="h-9 w-full px-3 text-[13px] text-gray-500 xl:w-auto"
          onclick={() => { filterZone = ''; filterType = ''; filterStatus = ''; search = ''; page = 1 }}>
          Reset
        </Button>
      {/if}
    </div>
  </div>

  <DataTable
    data={gates}
    {loading}
    {canManage}
    {canPairing}
    {openDetail}
    {openToggle}
    {openPairing}
    serverTotal={totalGates}
    bind:page
    bind:pageSize
  />
</div>

<!-- Detail Dialog -->
<Dialog.Root bind:open={detailOpen}>
  <Dialog.Content class="max-w-md gap-0 p-0">
    <Dialog.Header class="border-b border-gray-100 px-6 py-4">
      <Dialog.Title class="text-[15px] font-semibold text-gray-900">{selectedGate?.name}</Dialog.Title>
      <Dialog.Description class="text-[12px] text-gray-400">{selectedGate?.zone_name}</Dialog.Description>
    </Dialog.Header>
    {#if selectedGate}
      <div class="space-y-3 px-6 py-5">
        <div class="flex gap-2">
          {#if selectedGate.gate_type === 'entry'}
            <Badge class="gap-1 bg-green-100 text-green-700 hover:bg-green-100"><ArrowDownToLine size={10} /> Entry</Badge>
          {:else}
            <Badge class="gap-1 bg-orange-100 text-orange-700 hover:bg-orange-100"><ArrowUpFromLine size={10} /> Exit</Badge>
          {/if}
          {#if selectedGate.is_active}
            <Badge class="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><DoorOpen size={10} /> Aktif</Badge>
          {:else}
            <Badge class="gap-1 bg-gray-100 text-gray-500 hover:bg-gray-100"><DoorClosed size={10} /> Nonaktif</Badge>
          {/if}
        </div>
        <Separator />
        <div class="space-y-2.5">
          {#each [
            { label: 'ID', value: selectedGate.id, mono: true },
            { label: 'Zona', value: selectedGate.zone_name },
            { label: 'Lokasi', value: selectedGate.location_desc || '—' },
            { label: 'Token terakhir', value: selectedGate.token_last_used_at ? formatDateTime(selectedGate.token_last_used_at) : '—' },
            { label: 'Dibuat', value: formatDateTime(selectedGate.created_at) },
            { label: 'Diperbarui', value: formatDateTime(selectedGate.updated_at) },
          ] as row}
            <div class="flex items-start justify-between gap-4">
              <span class="w-28 flex-shrink-0 text-[12px] text-gray-400">{row.label}</span>
              <span class="text-right text-[13px] {row.mono ? 'break-all font-mono text-[11px] text-gray-500' : 'text-gray-800'}">{row.value}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<!-- Toggle Active AlertDialog -->
<AlertDialog.Root
  open={toggleGate !== null}
  onOpenChange={(o) => { if (!o) toggleGate = null }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>
        {toggleGate?.is_active ? 'Nonaktifkan' : 'Aktifkan'} Gate?
      </AlertDialog.Title>
      <AlertDialog.Description>
        Gate <span class="font-semibold">{toggleGate?.name}</span> akan
        {toggleGate?.is_active ? 'dinonaktifkan dan tidak bisa menerima transaksi baru.' : 'diaktifkan kembali.'}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={doToggle}
        disabled={toggleLoading}
        class={toggleGate?.is_active ? '!bg-red-500 !text-white hover:!bg-red-600' : '!bg-emerald-600 !text-white hover:!bg-emerald-700'}
      >
        {#if toggleLoading}<Loader2 size={13} class="animate-spin" />{/if}
        {toggleGate?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<!-- Pairing Dialog -->
<Dialog.Root bind:open={pairingOpen} onOpenChange={(o) => { if (!o) closePairing() }}>
  <Dialog.Content class="max-w-sm gap-0 p-0">
    <Dialog.Header class="border-b border-gray-100 px-6 py-4">
      <Dialog.Title class="flex items-center gap-2 text-[15px] font-semibold text-gray-900">
        <QrCode size={16} />
        Pairing Device
      </Dialog.Title>
      <Dialog.Description class="text-[12px] text-gray-400">
        Gate: <span class="font-medium">{pairingGate?.name}</span>
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 px-6 py-5">
      {#if pairingSuccess}
        <div class="flex flex-col items-center gap-3 py-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <DoorOpen size={22} class="text-emerald-600" />
          </div>
          <p class="text-[14px] font-semibold text-gray-900">Pairing Berhasil!</p>
          <p class="text-center text-[13px] text-gray-500">
            Device dipasangkan ke gate <span class="font-medium">{pairingGate?.name}</span>.
            Device menerima token via SSE secara otomatis.
          </p>
          <Button onclick={closePairing} class="mt-2 !bg-emerald-600 !text-white hover:!bg-emerald-700">Selesai</Button>
        </div>

      {:else if !pairingInfo}
        <!-- Scanner -->
        <div class="space-y-3">
          <p class="text-[13px] text-gray-500">Arahkan kamera ke QR code yang tampil di layar device gate.</p>

          <!-- Video preview -->
          <div class="relative overflow-hidden rounded-lg bg-black" style="aspect-ratio: 1">
            <!-- svelte-ignore a11y_media_has_caption -->
            <video bind:this={videoEl} class="h-full w-full object-cover" playsinline />
            <canvas bind:this={canvasEl} class="hidden" />
            {#if !scanActive}
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <QrCode size={40} class="text-white/40" />
                <p class="text-[13px] text-white/60">Kamera belum aktif</p>
              </div>
            {:else}
              <!-- Scan overlay -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="h-48 w-48 rounded-lg border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  <div class="absolute left-0 top-0 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-white"></div>
                  <div class="absolute right-0 top-0 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-white"></div>
                  <div class="absolute bottom-0 left-0 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-white"></div>
                  <div class="absolute bottom-0 right-0 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-white"></div>
                </div>
              </div>
            {/if}
          </div>

          {#if scanError}
            <p class="text-[12px] text-red-500">{scanError}</p>
          {/if}
          {#if pairingInfoError}
            <p class="text-[12px] text-red-500">{pairingInfoError}</p>
          {/if}

          {#if !scanActive}
            <Button onclick={startScanner} class="w-full !bg-[#e11d48] !text-white hover:!bg-[#be123c]">
              <QrCode size={14} />
              Buka Kamera
            </Button>
          {:else}
            <Button variant="outline" onclick={stopScanner} class="w-full text-[13px]">
              Batalkan Scan
            </Button>
          {/if}
        </div>

      {:else}
        <!-- Hasil scan — info device + konfirmasi -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-[12px] font-semibold uppercase tracking-widest text-gray-400">Info Device</p>
            <button
              class="text-[12px] text-gray-400 hover:text-gray-600"
              onclick={() => { pairingInfo = null; pairingCode = ''; pairingInfoError = ''; startScanner() }}
            >
              Scan ulang
            </button>
          </div>

          {#if pairingInfoLoading}
            <div class="flex items-center justify-center py-6">
              <Loader2 size={20} class="animate-spin text-gray-400" />
            </div>
          {:else}
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
              {#each [
                { label: 'Kode', value: pairingInfo.code, mono: true },
                { label: 'Status', value: pairingInfo.status === 'confirmed' ? 'Sudah dikonfirmasi' : pairingInfo.is_expired ? 'Kadaluarsa' : 'Menunggu' },
                { label: 'IP Device', value: pairingInfo.ip_address },
                { label: 'Kadaluarsa', value: formatDateTime(pairingInfo.expires_at) },
              ] as row}
                <div class="flex items-center justify-between gap-3">
                  <span class="text-[12px] text-gray-400">{row.label}</span>
                  <span class="text-[13px] {row.mono ? 'font-mono text-gray-600' : 'text-gray-800'}">{row.value}</span>
                </div>
              {/each}
            </div>

            {#if pairingInfo.status === 'confirmed'}
              <p class="text-[12px] text-amber-600">Kode ini sudah pernah dikonfirmasi sebelumnya.</p>
            {:else if pairingInfo.is_expired}
              <p class="text-[12px] text-red-500">Kode sudah kadaluarsa. Minta device generate kode baru.</p>
            {:else}
              {#if pairingConfirmError}
                <p class="text-[12px] text-red-500">{pairingConfirmError}</p>
              {/if}
              <Button
                onclick={doConfirmPairing}
                disabled={pairingConfirmLoading}
                class="w-full !bg-[#e11d48] !text-white hover:!bg-[#be123c]"
              >
                {#if pairingConfirmLoading}<Loader2 size={13} class="animate-spin" />{/if}
                Konfirmasi Pairing ke {pairingGate?.name}
              </Button>
            {/if}
          {/if}
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
