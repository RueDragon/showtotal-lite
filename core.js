const https = require('node:https')

function validateSettings(input) {
  const url = new URL(String(input.baseUrl || '').trim())
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('接口地址必须是 HTTPS 地址，不能包含账号、查询参数或片段')
  const token = String(input.token || '').trim().replace(/^Bearer\s+/i, '')
  if (!token || /[\r\n]/.test(token) || token.length > 8192) throw new Error('请输入有效的 API key')
  return {baseUrl:url.href.replace(/\/$/, ''), token, orgPath:String(input.orgPath || '').trim()}
}

function priceText(model) {
  const pricing = model && model.pricing
  if (!pricing) return ''
  const raw = model.standard_discount && model.standard_discount.min_vendor_discount_rate
  const rate = raw != null && Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) : 1
  const values = [pricing.input_price, pricing.output_price, pricing.cache_hit_price ?? pricing.cache_price]
  if (values.some(value => value == null || !Number.isFinite(Number(value)))) return ''
  return values.map(value => String(Number((Number(value) * rate).toFixed(6)))).join('/')
}

function yesterday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai', year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now)
  const pick = type => parts.find(part => part.type === type).value
  return new Date(Date.UTC(Number(pick('year')), Number(pick('month')) - 1, Number(pick('day')) - 1)).toISOString().slice(0,10)
}

function requestJson(settings, endpoint, params = {}) {
  const url = new URL(settings.baseUrl + '/' + endpoint)
  Object.entries(params).forEach(([key,value]) => url.searchParams.set(key,String(value)))
  return new Promise((resolve,reject) => {
    const req = https.get(url, {headers:{Authorization:'Bearer ' + settings.token}}, res => {
      let raw = ''
      res.setEncoding('utf8')
      res.on('data', chunk => {
        raw += chunk
        if (raw.length > 16 * 1024 * 1024) req.destroy(new Error('响应过大'))
      })
      res.on('error', () => reject(new Error('响应读取失败')))
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(res.statusCode === 401 || res.statusCode === 403 ? '认证失败，请检查 API key 或权限' : '接口返回 HTTP ' + res.statusCode))
        try { const data = JSON.parse(raw); if (data.error) throw new Error(); resolve(data) } catch { reject(new Error('接口数据无效或请求受限')) }
      })
    })
    req.setTimeout(15000, () => req.destroy(new Error('请求超时')))
    req.on('error', error => reject(new Error(error.message === '请求超时' ? error.message : '连接失败，请检查网络和接口地址')))
  })
}
module.exports = {validateSettings, priceText, yesterday, requestJson}
