import { Component, EventEmitter, Inject, Input, OnChanges } from '@angular/core'
import { CommonModule, Location } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { RouterModule } from '@angular/router'
import { UntilDestroy } from '@ngneat/until-destroy'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { catchError, map, Observable, of, ReplaySubject } from 'rxjs'
import { PanelMenuModule } from 'primeng/panelmenu'

import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  provideTranslateServiceForRoot
} from '@onecx/angular-remote-components'
import { UserService } from '@onecx/angular-integration-interface'
import { createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator'
import { PortalCoreModule } from '@onecx/portal-integration-angular'

import { Configuration, SearchWorkspacesResponse, WorkspaceAPIService } from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-list-workspaces-using-theme',
  templateUrl: './list-workspaces-using-theme.component.html',
  standalone: true,
  imports: [
    AngularRemoteComponentsModule,
    CommonModule,
    PortalCoreModule,
    RouterModule,
    TranslateModule,
    SharedModule,
    PanelMenuModule
  ],
  providers: [
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1)
    },
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createRemoteComponentTranslateLoader,
        deps: [HttpClient, BASE_URL]
      }
    })
  ]
})
@UntilDestroy()
export class OneCXListWorkspacesUsingThemeComponent implements ocxRemoteComponent, ocxRemoteWebcomponent, OnChanges {
  @Input() themeName: string | undefined = undefined
  @Input() workspaceList = new EventEmitter<string[]>()

  public workspacesUsingTheme: Observable<string[]> | undefined

  constructor(
    @Inject(BASE_URL) private readonly baseUrl: ReplaySubject<string>,
    private readonly userService: UserService,
    private readonly translateService: TranslateService,
    private readonly workspaceApi: WorkspaceAPIService
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang))
  }

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  ocxInitRemoteComponent(remoteComponentConfig: RemoteComponentConfig) {
    this.baseUrl.next(remoteComponentConfig.baseUrl)
    this.workspaceApi.configuration = new Configuration({
      basePath: Location.joinWithSlash(remoteComponentConfig.baseUrl, environment.apiPrefix)
    })
  }

  ngOnChanges(): void {
    if (this.themeName) this.findWorkspacesUsingTheme()
  }

  public findWorkspacesUsingTheme() {
    this.workspacesUsingTheme = this.workspaceApi
      .searchWorkspaces({ searchWorkspacesRequest: { themeName: this.themeName } })
      .pipe(
        catchError((err) => {
          console.error('searchWorkspaces', err)
          return of({ stream: [] } as SearchWorkspacesResponse)
        }),
        map((data) => {
          const workspaces: string[] = []
          if (data.stream) {
            data.stream.forEach((ws) => {
              workspaces.push(ws.displayName)
            })
          }
          this.workspaceList.emit(workspaces)
          return workspaces
        })
      )
  }
}
