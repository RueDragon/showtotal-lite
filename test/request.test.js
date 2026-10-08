const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const vm=require('node:vm')
const path=require('node:path')
const {EventEmitter}=require('node:events')
test('absolute 20 second deadline destroys request and returns timeout',async()=>{
  let delay,deadline,cleared=false
  const req=new EventEmitter()
  req.destroy=error=>req.emit('error',error)
  const sandbox={module:{exports:{}},URL,require:name=>{
    assert.equal(name,'node:https');return {get:()=>req}
  },setTimeout:(fn,ms)=>{deadline=fn;delay=ms;return 1},clearTimeout:()=>{cleared=true}}
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../core.js'),'utf8'),sandbox)
  const result=sandbox.module.exports.requestJson({baseUrl:'https://example.com/api',token:'fixture'},'user/usage/today')
  assert.equal(delay,20000);deadline()
  await assert.rejects(result,/请求超时/);assert.equal(cleared,true)
})
