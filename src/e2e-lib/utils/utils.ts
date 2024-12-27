import { exec } from 'child_process'
import path from 'path'

export interface OneCXServicePortConfig {
  THEME_SVC_PORT: number
  PERMISSION_SVC_PORT: number
  PRODUCT_STORE_SVC_PORT: number
  USER_PROFILE_SVC_PORT: number
  IAM_KC_SVC_PORT: number
  TENANT_SVC_PORT: number
  WORKSPACE_SVC_PORT: number
}

export async function importDatabaseData(config: OneCXServicePortConfig, importScriptPath: string) {
  const importScriptDir = path.dirname(importScriptPath)
  const cwd = process.cwd()
  return new Promise((resolve, reject) => {
    const variables = Object.keys(config).reduce((acc, key) => acc + `${key}=${config[key]} `, '')
    exec(`cd ${importScriptDir}; ${variables} . ${importScriptPath}; cd ${cwd}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error importing database data: ${error.message}`)
        console.error(`Error output:\n${stdout}`)
        return reject(error)
      }
      console.log(`Database data import output:\n${stdout}`)
      if (stderr) {
        console.error(`Database data import errors:\n${stderr}`)
      }
      resolve(null)
    })
  })
}
