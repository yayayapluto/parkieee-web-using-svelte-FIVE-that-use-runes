<script lang="ts">
  import { formatCurrency } from '$lib/utils/format'

  let {
    effectiveFee,
    isGracePeriod,
    cashInput = $bindable(''),
    cashTendered,
    cashChange,
    cashValid,
    cashPresets,
    onAddPreset,
    onBack,
    onConfirm,
  }: {
    effectiveFee:  number
    isGracePeriod: boolean
    cashInput:     string
    cashTendered:  number
    cashChange:    number
    cashValid:     boolean
    cashPresets:   number[]
    onAddPreset:   (val: number) => void
    onBack:        () => void
    onConfirm:     () => void
  } = $props()
</script>

<div class="w-full max-w-[480px] flex flex-col gap-5">
  <p class="text-center text-[13px] font-semibold text-gray-700 uppercase tracking-[0.1em]">Pembayaran Tunai</p>

  <!-- Total tagihan -->
  <div class="border border-gray-200 px-6 py-5 flex justify-between items-center">
    <span class="text-[13px] text-gray-500">Total Tagihan</span>
    {#if isGracePeriod}
      <span class="text-[22px] font-bold text-[#15803d]">
        Rp 0 <span class="text-xs text-gray-500 font-normal">(gratis)</span>
      </span>
    {:else}
      <span class="text-[22px] font-bold text-gray-900">{formatCurrency(effectiveFee)}</span>
    {/if}
  </div>

  {#if !isGracePeriod}
    <!-- Preset -->
    <div class="flex flex-wrap gap-2 justify-center">
      {#each cashPresets as preset}
        <button
          onclick={() => onAddPreset(preset)}
          class="border border-gray-300 bg-white px-4 py-2 text-[13px] text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          +{formatCurrency(preset)}
        </button>
      {/each}
    </div>

    <!-- Input -->
    <div class="border border-gray-300 px-5 py-3">
      <p class="text-[11px] text-gray-400 mb-1">Uang Diterima</p>
      <input
        bind:value={cashInput}
        oninput={() => { cashInput = cashInput.replace(/\D/g, '') }}
        placeholder="0"
        class="w-full bg-transparent border-none outline-none text-[28px] font-bold text-gray-900 font-[family-name:var(--font-family-kiosk)] placeholder:text-gray-300"
      />
    </div>

    <!-- Kembalian -->
    {#if cashTendered > 0}
      <div class="border border-gray-200 px-5 py-3 flex justify-between">
        <span class="text-[13px] text-gray-500">Kembalian</span>
        <span class="text-base font-bold {cashValid ? 'text-[#15803d]' : 'text-red-600'}">
          {cashValid ? formatCurrency(cashChange) : 'Kurang'}
        </span>
      </div>
    {/if}
  {/if}

  <!-- Aksi -->
  <div class="grid grid-cols-2 gap-3 mt-2">
    <button
      onclick={onBack}
      class="py-3.5 border border-gray-300 bg-white text-sm text-gray-700 cursor-pointer font-semibold tracking-wide hover:bg-gray-50 transition-colors uppercase"
    >
      KEMBALI
    </button>
    <button
      onclick={onConfirm}
      disabled={!cashValid && !isGracePeriod}
      class="py-3.5 text-sm font-bold text-white uppercase tracking-[0.05em] transition-colors cursor-pointer disabled:cursor-not-allowed"
      class:bg-[#1a56db]={cashValid || isGracePeriod}
      class:hover:bg-blue-700={cashValid || isGracePeriod}
      class:bg-blue-200={!cashValid && !isGracePeriod}
    >
      {isGracePeriod ? 'LANJUTKAN GRATIS' : 'KONFIRMASI'}
    </button>
  </div>
</div>
