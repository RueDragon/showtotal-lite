;(function (root) {
  const refreshMinutes = value => [5, 10, 15].includes(Number(value)) ? Number(value) : 5
  const day = (now = Date.now()) => new Date(now + 8 * 3600000).toISOString().slice(0, 10)
  function trend(previous, current) {
    if (!previous || previous.day !== current.day || current.at - previous.at < 60000) return null
    const spent = current.cost - previous.cost
    if (!Number.isFinite(spent) || spent < 0 || !Number.isFinite(current.remaining)) return null
    const perHour = spent / ((current.at - previous.at) / 3600000)
    return { perHour, hoursLeft: perHour > 0 ? current.remaining / perHour : null }
  }
  function firstTokenSeconds(log) {
    const raw = log.ttft_ms ?? log.first_token_latency_ms
    if (raw == null && log.ttft != null && log.total_duration != null) {
      const ttft=Number(log.ttft), total=Number(log.total_duration), output=Number(log.output_tokens ?? log.completion_tokens)
      if (!Number.isFinite(ttft) || ttft<0 || !Number.isFinite(total) || total<=ttft || !Number.isFinite(output) || output<0) return null
      const seconds=(total-ttft)/1000, speed=output/seconds
      return speed>=0.1 && speed<=800 ? ttft/1000 : ttft
    }
    if (raw == null) return null
    const explicit = Number(raw)
    return Number.isFinite(explicit) && explicit >= 0 ? explicit / 1000 : null
  }
  function selectLogs(logs, mode) {
    if (mode === 'cost') return logs.slice().sort((a, b) => (Number(b.quota_cost) || 0) - (Number(a.quota_cost) || 0))
    if (mode === 'slow') return logs.filter(log => firstTokenSeconds(log) != null).sort((a, b) => firstTokenSeconds(b) - firstTokenSeconds(a))
    return logs.slice()
  }
  const api = { refreshMinutes, day, trend, firstTokenSeconds, selectLogs }
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.usageCore = api
})(typeof globalThis === 'object' ? globalThis : this)
