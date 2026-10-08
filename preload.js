const {contextBridge,ipcRenderer} = require('electron')
contextBridge.exposeInMainWorld('widget', {
  settings:() => ipcRenderer.invoke('settings:get'),
  save:input => ipcRenderer.invoke('settings:save',input),
  clear:() => ipcRenderer.invoke('settings:clear'),
  data:(type,options) => ipcRenderer.invoke('data:get',type,options),
  pin:value => ipcRenderer.invoke('window:pin',value),
  close:() => ipcRenderer.invoke('window:close')
})
