const {app,BrowserWindow,ipcMain,Tray,Menu,screen,Notification} = require('electron')
const usageCore = require('./usage-core')
const fs = require('node:fs')
const path = require('node:path')
const {validateSettings} = require('./core')
const {getData} = require('./adapter')
const {envPath,loadEnv,saveEnv} = require('./env')
app.setName('showTotal Lite')
app.setAppUserModelId('io.github.ruedragon.showtotal.lite')
let win
let tray, quitting = false, stateTimer
let state = {pinned:true,refreshMinutes:5}
const statePath = () => path.join(app.getPath('userData'),'widget-state.json')
function saveState() {fs.mkdirSync(path.dirname(statePath()),{recursive:true});fs.writeFileSync(statePath(),JSON.stringify(state),'utf8')}
function showWindow() {win.show();win.focus()}
let settings = null
const configPath = () => envPath(app)
function publicSettings() { return {baseUrl:settings?.baseUrl || '', orgPath:settings?.orgPath || '', configured:!!settings,pinned:state.pinned,refreshMinutes:usageCore.refreshMinutes(state.refreshMinutes)} }
function register(channel, handler) {
  ipcMain.handle(channel, async (event,...args) => {
    if (event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame) throw new Error('Invalid sender')
    try { return {ok:true,data:await handler(...args)} } catch (error) { return {ok:false,error:error.message} }
  })
}
app.whenReady().then(() => {
  try {state={...state,...JSON.parse(fs.readFileSync(statePath(),'utf8'))}} catch {}
  try {
    settings = loadEnv(configPath())
  } catch { settings = null }
  win = new BrowserWindow({width:330,height:440,minWidth:300,minHeight:360,frame:false,alwaysOnTop:true,backgroundColor:'#edf5f1',icon:path.join(__dirname,'assets/showtotal.ico'),webPreferences:{preload:path.join(__dirname,'preload.js'),nodeIntegration:false,contextIsolation:true,sandbox:true}})
  win.webContents.setWindowOpenHandler(() => ({action:'deny'}))
  win.setAlwaysOnTop(Boolean(state.pinned))
  if(Number.isFinite(state.x)&&Number.isFinite(state.y)) {
    const area=screen.getDisplayMatching({x:state.x,y:state.y,width:330,height:440}).workArea
    win.setPosition(Math.round(Math.max(area.x,Math.min(state.x,area.x+area.width-330))),Math.round(Math.max(area.y,Math.min(state.y,area.y+area.height-440))))
  }
  win.on('move',()=>{const {x,y}=win.getBounds();Object.assign(state,{x,y});clearTimeout(stateTimer);stateTimer=setTimeout(()=>{try{saveState()}catch{}},300)})
  try {
    tray=new Tray(path.join(__dirname,'assets/showtotal.ico'));tray.setToolTip('showTotal Lite');tray.on('double-click',showWindow)
    tray.setContextMenu(Menu.buildFromTemplate([
      {label:'显示窗口',click:showWindow},
      {label:'开机启动',type:'checkbox',checked:app.getLoginItemSettings().openAtLogin,click:item=>app.setLoginItemSettings({openAtLogin:item.checked,path:process.env.PORTABLE_EXECUTABLE_FILE || process.execPath,args:app.isPackaged?[]:[__dirname]})},
      {type:'separator'},{label:'退出',click:()=>app.quit()}
    ]))
  } catch {tray=null}
  win.on('close',event=>{if(!quitting&&tray){event.preventDefault();win.hide()}})
  win.webContents.on('will-navigate', event => event.preventDefault())
  register('settings:get',publicSettings)
  register('settings:save', input => {
    const next = validateSettings({...input,token:input.token || settings?.token})
    saveEnv(configPath(),next)
    settings = next
    return publicSettings()
  })
  register('settings:clear', () => {fs.rmSync(configPath(),{force:true}); settings=null; return publicSettings()})
  register('window:pin', value => {state.pinned=!!value;win.setAlwaysOnTop(state.pinned);saveState();return state.pinned})
  register('window:close', () => {if(tray)win.hide();else app.quit()})
  register('preferences:refresh',value=>{state.refreshMinutes=usageCore.refreshMinutes(value);saveState();return state.refreshMinutes})
  register('usage:warning',()=>{
    const day=usageCore.day();if(state.warningDay===day||!Notification.isSupported())return false
    state.warningDay=day;saveState();new Notification({title:'showTotal Lite',body:'今日总剩余额度低于20%，请留意用量。'}).show();return true
  })
  register('data:get', async (type, options = {}) => {
    if (!settings) throw new Error('请先填写接口地址和 API key')
    return getData(settings,type,options)
  })
  win.loadFile(path.join(__dirname,'index.html'))
})
app.on('before-quit',()=>{quitting=true;clearTimeout(stateTimer);try{saveState()}catch{}})
app.on('window-all-closed', () => {if(!tray)app.quit()})
