const {app,BrowserWindow,ipcMain} = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const {validateSettings} = require('./core')
const {getData} = require('./adapter')
const {envPath,loadEnv,saveEnv} = require('./env')
app.setName('showTotal Lite')
app.setAppUserModelId('io.github.ruedragon.showtotal.lite')
let win
let settings = null
const configPath = () => envPath(app)
function publicSettings() { return {baseUrl:settings?.baseUrl || '', orgPath:settings?.orgPath || '', configured:!!settings} }
function register(channel, handler) {
  ipcMain.handle(channel, async (event,...args) => {
    if (event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame) throw new Error('Invalid sender')
    try { return {ok:true,data:await handler(...args)} } catch (error) { return {ok:false,error:error.message} }
  })
}
app.whenReady().then(() => {
  try {
    settings = loadEnv(configPath())
  } catch { settings = null }
  win = new BrowserWindow({width:330,height:440,minWidth:300,minHeight:360,frame:false,alwaysOnTop:true,backgroundColor:'#edf5f1',icon:path.join(__dirname,'assets/showtotal.ico'),webPreferences:{preload:path.join(__dirname,'preload.js'),nodeIntegration:false,contextIsolation:true,sandbox:true}})
  win.webContents.setWindowOpenHandler(() => ({action:'deny'}))
  win.webContents.on('will-navigate', event => event.preventDefault())
  register('settings:get',publicSettings)
  register('settings:save', input => {
    const next = validateSettings({...input,token:input.token || settings?.token})
    saveEnv(configPath(),next)
    settings = next
    return publicSettings()
  })
  register('settings:clear', () => {fs.rmSync(configPath(),{force:true}); settings=null; return publicSettings()})
  register('window:pin', value => {win.setAlwaysOnTop(!!value); return !!value})
  register('window:close', () => app.quit())
  register('data:get', async (type, options = {}) => {
    if (!settings) throw new Error('请先填写接口地址和 API key')
    return getData(settings,type,options)
  })
  win.loadFile('index.html')
})
app.on('window-all-closed', () => app.quit())
