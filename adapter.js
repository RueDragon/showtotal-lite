const {requestJson,priceText,yesterday} = require('./core')
// Fork this module to adapt another billing platform. Keep credentials in main.
async function getData(settings,type,options={}) {
  if(type==='usage') return requestJson(settings,'user/usage/today')
  if(type==='logs') return requestJson(settings,'user/logs/recent',{limit:100})
  if(type==='models') {
    const payload=await requestJson(settings,'user/models')
    return (Array.isArray(payload.data)?payload.data:[]).map(model=>({id:model.id,price:priceText(model)}))
  }
  if(type==='rank') {
    if(!settings.orgPath) throw new Error('请在设置中填写团队路径后查看榜单')
    const day=yesterday()
    const payload=await requestJson(settings,'team/usage/members',{org_path:settings.orgPath,start_date:day,end_date:day,scope:'all',page:Math.max(1,Math.min(1000,Number(options.page)||1)),page_size:10,sort_by:options.sort==='requests'?'requests':'amount'})
    return {date:day,...payload.data}
  }
  throw new Error('不支持的数据类型')
}
module.exports={getData}
