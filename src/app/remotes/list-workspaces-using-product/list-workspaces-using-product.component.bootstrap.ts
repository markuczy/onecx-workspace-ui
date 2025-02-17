import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserModule } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'
import { importProvidersFrom } from '@angular/core'
import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { environment } from 'src/environments/environment'
import { OneCXListWorkspacesUsingProductComponent } from './list-workspaces-using-product.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

bootstrapRemoteComponent(
  OneCXListWorkspacesUsingProductComponent,
  'ocx-list-workspaces-using-product-component',
  environment.production,
  [
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(AngularAuthModule),
    importProvidersFrom(BrowserModule),
    importProvidersFrom(BrowserAnimationsModule),
    provideRouter([
      {
        path: '**',
        children: []
      }
    ])
  ]
)
