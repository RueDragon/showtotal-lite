const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const core=require('../usage-core')
test('refresh interval is at least five minutes and restricted to presets',()=>{
  for(const value of [1,0,null,'bad',30])assert.equal(core.refreshMinutes(value),5)
  assert.equal(core.refreshMinutes('10'),10);assert.equal(core.refreshMinutes(15),15)
})
test('trend ignores day rollover and decreasing counters',()=>{
  const previous={day:'2026-10-08',at:0,cost:10}
  assert.deepEqual(core.trend(previous,{day:previous.day,at:3600000,cost:12,remaining:8}),{perHour:2,hoursLeft:4})
  assert.equal(core.trend(previous,{day:'2026-10-09',at:3600000,cost:12,remaining:8}),null)
  assert.equal(core.trend(previous,{day:previous.day,at:3600000,cost:1,remaining:8}),null)
})
test('log sorting preserves recent order and excludes unavailable latency',()=>{
  const logs=[{quota_cost:1,ttft_ms:2000},{quota_cost:3},{quota_cost:2,ttft_ms:3000}]
  assert.equal(core.selectLogs(logs,'cost')[0],logs[1])
  assert.deepEqual(core.selectLogs(logs,'slow'),[logs[2],logs[0]])
  assert.equal(logs[0].quota_cost,1)
  assert.equal(core.firstTokenSeconds({ttft:200,total_duration:2200,output_tokens:100}),0.2)
})
test('public package includes enhancement assets and no private extension',()=>{
  const pkg=require('../package.json')
  for(const file of ['usage-core.js','enhancements.css'])assert.ok(pkg.build.files.includes(file))
  assert.ok(!pkg.build.files.some(file=>file.includes('personal')))
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8')
  assert.ok(html.includes('src="usage-core.js"'));assert.ok(html.includes('href="enhancements.css"'))
})
