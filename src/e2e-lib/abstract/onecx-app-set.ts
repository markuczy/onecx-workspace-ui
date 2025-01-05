import { OneCXAppContainer } from './onecx-app'

export class OneCXAppSet<T extends OneCXAppContainer> {
  private appList: Array<T> = []

  add(appToAdd: T) {
    this.appList.push(appToAdd)
  }

  remove(appToRemove: T) {
    this.appList = this.appList.filter(
      (app) =>
        !(
          app.getOneCXAppId() === appToRemove.getOneCXAppId() &&
          app.getOneCXAppType() === appToRemove.getOneCXAppType() &&
          app.getOneCXApplicationName() === appToRemove.getOneCXApplicationName()
        )
    )
  }

  replace(appToReplace: T) {
    this.remove(appToReplace)
    this.add(appToReplace)
  }

  has(app: T) {
    return this.appList.some(
      (otherApp) =>
        app.getOneCXAppId() === otherApp.getOneCXAppId() &&
        app.getOneCXAppType() === otherApp.getOneCXAppType() &&
        app.getOneCXApplicationName() === otherApp.getOneCXApplicationName()
    )
  }

  get(app: T): T | undefined {
    return this.appList.find(
      (otherApp) =>
        app.getOneCXAppId() === otherApp.getOneCXAppId() &&
        app.getOneCXAppType() === otherApp.getOneCXAppType() &&
        app.getOneCXApplicationName() === otherApp.getOneCXApplicationName()
    )
  }

  values(): Array<T> {
    return this.appList
  }
}
