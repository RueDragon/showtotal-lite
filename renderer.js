const $ = id => document.getElementById(id)
let page = 'usage', configured = false, pinned = true, busy = false, generation = 0
let rankPage = 0, rankTotal = null, rankCount = 0, rankSort = 'amount'
let prices = new Map()
const number = value => value == null || !Number.isFinite(Number(value)) ? null : Number(value)
const money = value => number(value) == null ? '--' : '¥' + Number(value).toFixed(2)
const compact = value => number(value) == null ? '--' : Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(Number(value))
function node(tag, className, text) {const el=document.createElement(tag);el.className=className;el.textContent=text ?? '';return el}
function empty(id,text) {$(id).replaceChildren(node('div','empty',text))}
function showPage() {
  for (const name of ['usage','logs','rank','setup']) $(name).hidden = name !== page
  document.querySelectorAll('nav [data-page]').forEach(button => button.classList.toggle('active',button.dataset.page===page))
}
async function api(type,options) {
  const result = await window.widget.data(type,options)
  if (!result.ok) throw new Error(result.error)
  return result.data
}
function renderUsage(payload) {
  const data=payload.data || payload
  $('cost').textContent=money(data.quota_cost)
  $('requests').textContent=compact(data.request_count ?? data.total_requests ?? data.requests) + ' 次请求'
  const categories=Array.isArray(data.categories) ? data.categories : []
  $('quotas').replaceChildren()
  for (const category of categories) {
    const limit=number(category.daily_limit_yuan),remaining=number(category.daily_remaining_yuan)
    const row=node('div','quota'),label=node('div','quota-label'),track=node('div','track'),fill=node('div','fill')
    label.append(node('span','',category.category_name || category.category_code),node('span','',money(remaining)+' / '+money(limit)))
    fill.style.width=limit>0 && remaining!=null ? Math.max(0,Math.min(100,remaining/limit*100))+'%' : '0%'
    track.append(fill);row.append(label,track);$('quotas').append(row)
  }
  if (!categories.length) $('quotas').append(node('div','section-note','今日余额 '+money(data.daily_remaining_yuan)))
  const cached=number(data.total_cache_tokens),input=number(data.total_input_tokens)
  const rate=cached!=null && input!=null && cached+input>0 ? (cached/(cached+input)*100).toFixed(1)+'%' : '--'
  $('tokens').replaceChildren()
  for (const [label,value] of [['总 Token',compact(data.total_tokens)],['缓存命中',rate],['输入',compact(input)],['输出',compact(data.total_output_tokens)]]) {
    const row=node('div','token');row.append(node('span','',label),node('strong','',value));$('tokens').append(row)
  }
}
function logItems(payload) {
  if (Array.isArray(payload)) return payload
  for (const value of [payload.data,payload.logs,payload.items,payload.data?.items,payload.data?.logs]) if (Array.isArray(value)) return value
  return []
}
function renderLogs(payload) {
  const logs=logItems(payload)
  if (!logs.length) return empty('log-list','暂无日志')
  $('log-list').replaceChildren()
  for (const log of logs) {
    const row=node('div','log'),title=node('div','log-title'),model=node('span','model',log.model || '--')
    model.title=log.model || ''
    const rawTime=log.start_time ?? log.created_at ?? log.created_time ?? log.timestamp ?? log.time
    const date=new Date(typeof rawTime==='number' && rawTime<1e12 ? rawTime*1000 : rawTime)
    title.append(model,node('span','time',Number.isNaN(date.getTime()) ? '--' : date.toLocaleTimeString('zh-CN',{hour12:false})))
    const price=node('div','price',prices.get(log.model) || '')
    price.title='元/M tokens，按最小供应商折扣；不含阶梯和时段优惠'
    const stats=node('div','stats')
    const cost=number(log.quota_cost)
    for (const [label,value] of [['花费',cost==null?'--':'¥'+cost.toFixed(4)],['输入',compact(log.input_tokens ?? log.prompt_tokens)],['输出',compact(log.output_tokens ?? log.completion_tokens)]]) {
      const item=node('span','',label+' ');item.append(node('strong','',value));stats.append(item)
    }
    row.append(title,price,stats);$('log-list').append(row)
  }
}
function renderRank(data,reset) {
  const items=Array.isArray(data.items) ? data.items : []
  if (reset) {rankCount=0;$('rank-list').replaceChildren()}
  rankTotal=number(data.total)
  $('rank-date').textContent=data.date.slice(5)+' · '+(rankTotal==null?'团队用量':'共 '+rankTotal+' 人')
  for (const member of items) {
    const row=node('div','rank-row'),name=node('span','rank-name',member.user_name || member.user_code || '--')
    name.title=member.user_name || member.user_code || ''
    row.append(node('span','rank-no',++rankCount),name,node('span','rank-cost',money(member.amount)),node('span','rank-requests',compact(member.requests)))
    $('rank-list').append(row)
  }
  if (!rankCount) empty('rank-list','暂无团队用量')
  $('rank-more').hidden=items.length<10 || (rankTotal!=null && rankCount>=rankTotal)
  $('sort-cost').classList.toggle('active',rankSort==='amount')
  $('sort-requests').classList.toggle('active',rankSort==='requests')
}
async function refresh(more=false) {
  if (!configured || page==='setup' || busy) return
  busy=true;const ownGeneration=generation,current=page
  $('refresh').disabled=true;$('rank-more').disabled=true;$('status').textContent='加载中...'
  try {
    if (current==='usage') {const data=await api('usage');if(ownGeneration===generation) renderUsage(data)}
    if (current==='logs') {
      if (!prices.size) {try {prices=new Map((await api('models')).map(model=>[model.id,model.price]))} catch {prices=new Map()}}
      const data=await api('logs');if(ownGeneration===generation) renderLogs(data)
    }
    if (current==='rank') {
      const next=more ? rankPage+1 : 1,data=await api('rank',{page:next,sort:rankSort})
      if(ownGeneration===generation) {rankPage=next;renderRank(data,!more)}
    }
    if(ownGeneration===generation) {$('status').textContent='已更新';$('updated').textContent=new Date().toLocaleTimeString('zh-CN',{hour12:false})}
  } catch(error) {
    if(ownGeneration===generation) {$('status').textContent=error.message;if(current==='logs') empty('log-list',error.message);if(current==='rank'&&!more) empty('rank-list',error.message)}
  } finally {busy=false;$('refresh').disabled=false;$('rank-more').disabled=false;if(ownGeneration!==generation) refresh()}
}
document.querySelectorAll('nav [data-page]').forEach(button=>button.addEventListener('click',()=>{page=configured?button.dataset.page:'setup';generation++;showPage();refresh()}))
$('settings').addEventListener('click',()=>{page='setup';generation++;showPage()})
$('refresh').addEventListener('click',()=>refresh())
$('rank-more').addEventListener('click',()=>refresh(true))
for(const [id,sort] of [['sort-cost','amount'],['sort-requests','requests']]) $(id).addEventListener('click',()=>{rankSort=sort;generation++;refresh()})
$('pin').addEventListener('click',async()=>{pinned=!pinned;await window.widget.pin(pinned);$('pin').textContent=pinned?'置顶':'不置顶'})
$('close').addEventListener('click',()=>window.widget.close())
$('config-form').addEventListener('submit',async event=>{
  event.preventDefault()
  const result=await window.widget.save({baseUrl:$('base-url').value,token:$('api-key').value,orgPath:$('org-path').value})
  if(!result.ok) {$('status').textContent=result.error;return}
  $('api-key').value='';configured=true;prices.clear();page='usage';generation++;showPage();refresh()
})
$('forget').addEventListener('click',async()=>{
  const result=await window.widget.clear();if(!result.ok){$('status').textContent=result.error;return}
  configured=false;prices.clear();generation++;$('base-url').value='';$('api-key').value='';$('org-path').value='';$('cost').textContent='--';$('requests').textContent='--';$('quotas').replaceChildren();$('tokens').replaceChildren();$('log-list').replaceChildren();$('rank-list').replaceChildren();$('status').textContent='本机配置已清除'
})
window.widget.settings().then(result=>{
  if(!result.ok){$('status').textContent=result.error;return}
  configured=result.data.configured;$('base-url').value=result.data.baseUrl;$('org-path').value=result.data.orgPath;page=configured?'usage':'setup';showPage();refresh()
})
setInterval(()=>{if(page==='usage') refresh()},60000)
