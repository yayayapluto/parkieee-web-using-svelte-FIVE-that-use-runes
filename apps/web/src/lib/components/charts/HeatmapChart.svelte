<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import * as echarts from 'echarts'

  const { option, height = '300px', loading = false } = $props<{
    option: echarts.EChartsOption
    height?: string
    loading?: boolean
  }>()

  let el = $state<HTMLDivElement | null>(null)
  let chart: echarts.ECharts | null = null

  onMount(() => {
    if (!el) return
    chart = echarts.init(el, null, { renderer: 'svg' })
    chart.setOption(option)

    const ro = new ResizeObserver(() => chart?.resize())
    ro.observe(el)
    return () => ro.disconnect()
  })

  onDestroy(() => chart?.dispose())

  $effect(() => {
    if (!chart) return
    if (loading) {
      chart.showLoading({ text: '', maskColor: 'rgba(255,255,255,0.6)' })
    } else {
      chart.hideLoading()
      chart.setOption(option, { notMerge: false })
    }
  })
</script>

<div bind:this={el} style="width:100%;height:{height}"></div>
