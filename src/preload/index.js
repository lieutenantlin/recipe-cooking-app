import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  ingredients: {
    getAll: () => ipcRenderer.invoke('ingredients:getAll'),
    add: (data) => ipcRenderer.invoke('ingredients:add', data),
    update: (id, data) => ipcRenderer.invoke('ingredients:update', id, data),
    delete: (id) => ipcRenderer.invoke('ingredients:delete', id),
    getExpiring: () => ipcRenderer.invoke('ingredients:getExpiring')
  },
  recipes: {
    getAll: () => ipcRenderer.invoke('recipes:getAll'),
    add: (data) => ipcRenderer.invoke('recipes:add', data),
    update: (id, data) => ipcRenderer.invoke('recipes:update', id, data),
    delete: (id) => ipcRenderer.invoke('recipes:delete', id),
    getMatches: (mode) => ipcRenderer.invoke('recipes:getMatches', mode)
  },
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    update: (key, value) => ipcRenderer.invoke('settings:update', key, value)
  }
})
