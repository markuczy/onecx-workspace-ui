import { exec } from 'child_process'
import { StartedOneCXPostgresContainer } from './onecx-postgres'
import { ResourceType } from './resource-type'
import { StartedResource } from './started-resource'
import path from 'path'

export async function logStart(type: ResourceType, name?: string) {
  if (type === 'container') {
    console.log(`Starting ${name} container`)
  } else if (type === 'network') {
    console.log(`Starting network`)
  }
}
export async function logStarted(type: ResourceType, name?: string) {
  if (type === 'container') {
    console.log(`Started ${name} container`)
  } else if (type === 'network') {
    console.log(`Started network`)
  }
}
export async function logStopped(resource: StartedResource) {
  console.log(`Stopped ${resource.getName()}`)
}

// TODO: Assumption that the same name is the owner of the db
export async function checkDbExistence(
  databases: string[],
  postgres: StartedOneCXPostgresContainer,
  logFunction?: (message) => void
) {
  let allDatabasesExist = true
  for (const database of databases) {
    const databaseExists = await postgres.doesDatabaseExist(database, database)
    if (databaseExists) {
      logFunction && logFunction(`${database} exists.`)
    } else {
      logFunction && logFunction(`${database} does not exist.`)
      allDatabasesExist = false
    }
  }

  return allDatabasesExist
}

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
