import { OneCXAppContainer } from './onecx-app'

export class OneCXAppSet<T extends OneCXAppContainer> {
  private appList: Array<T> = []

  add(appToAdd: T) {
    this.remove(appToAdd)

    this.appList.push(appToAdd)
  }

  remove(appToRemove: T) {
    this.appList = this.appList.filter(
      (app) =>
        !(
          app.getOneCXAppDetails().appId === appToRemove.getOneCXAppDetails().appId &&
          app.getOneCXAppDetails().appType === appToRemove.getOneCXAppDetails().appType &&
          app.getOneCXAppDetails().applicationName === appToRemove.getOneCXAppDetails().applicationName
        )
    )
  }

  has(app: T) {
    return this.appList.some(
      (otherApp) =>
        app.getOneCXAppDetails().appId === otherApp.getOneCXAppDetails().appId &&
        app.getOneCXAppDetails().appType === otherApp.getOneCXAppDetails().appType &&
        app.getOneCXAppDetails().applicationName === otherApp.getOneCXAppDetails().applicationName
    )
  }

  values(): Array<T> {
    return this.appList
  }
}
