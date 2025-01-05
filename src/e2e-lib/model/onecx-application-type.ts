export class OneCXCoreApplications {
  static readonly THEME = 'theme'
  static readonly PERMISSION = 'permission'
  static readonly PRODUCT_STORE = 'productStore'
  static readonly USER_PROFILE = 'userProfile'
  static readonly IAM = 'iam'
  static readonly TENANT = 'tenant'
  static readonly WORKSPACE = 'workspace'
  static readonly SHELL = 'shell'
}

export type OneCXCoreApplication = (typeof OneCXCoreApplications)[keyof Omit<typeof OneCXCoreApplications, 'prototype'>]
