const fs = require('node:fs')
const path = require('node:path')
const {validateSettings} = require('./core')
function parseEnv(text) {
  const values = {}
  for (const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)) {
    const match = line.match(/^\s*(SHOWTOTAL_BASE_URL|SHOWTOTAL_API_KEY|SHOWTOTAL_ORG_PATH)\s*=\s*(.*?)\s*$/)
    if (!match) continue
    let value = match[2]
    if (value.startsWith('"') && value.endsWith('"')) value = JSON.parse(value)
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1,-1)
    values[match[1]] = value
  }
  return {baseUrl:values.SHOWTOTAL_BASE_URL || '',token:values.SHOWTOTAL_API_KEY || '',orgPath:values.SHOWTOTAL_ORG_PATH || ''}
}
function envPath(app) {
  return path.join(app.isPackaged ? (process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath)) : __dirname,'.env')
}
function loadEnv(file) {
  if (!fs.existsSync(file)) return null
  const parsed = parseEnv(fs.readFileSync(file,'utf8'))
  if (!parsed.baseUrl && !parsed.token) return null
  return validateSettings(parsed)
}
function saveEnv(file, settings) {
  const text = ['# Local configuration. Never share this file.', 'SHOWTOTAL_BASE_URL=' + JSON.stringify(settings.baseUrl), 'SHOWTOTAL_API_KEY=' + JSON.stringify(settings.token), 'SHOWTOTAL_ORG_PATH=' + JSON.stringify(settings.orgPath), ''].join('\n')
  fs.writeFileSync(file,text,{encoding:'utf8',mode:0o600})
}
module.exports = {parseEnv,envPath,loadEnv,saveEnv}
