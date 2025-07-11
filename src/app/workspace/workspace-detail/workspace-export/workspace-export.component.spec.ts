import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { WorkspaceAPIService } from 'src/app/shared/generated'

import { WorkspaceExportComponent } from './workspace-export.component'

describe('WorkspaceExportComponent', () => {
  let component: WorkspaceExportComponent
  let fixture: ComponentFixture<WorkspaceExportComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const apiServiceSpy = {
    getWorkspaceByName: jasmine.createSpy('getWorkspaceByName').and.returnValue(of({})),
    deleteWorkspace: jasmine.createSpy('deleteWorkspace').and.returnValue(of({})),
    exportWorkspaces: jasmine.createSpy('exportWorkspaces').and.returnValue(of({})),
    updateWorkspace: jasmine.createSpy('updateWorkspace').and.returnValue(of({}))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [WorkspaceExportComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: WorkspaceAPIService, useValue: apiServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceExportComponent)
    component = fixture.componentInstance
    component.workspace = {
      name: 'name',
      displayName: 'name',
      theme: 'theme',
      baseUrl: '/some/base/url',
      id: 'id'
    }
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('onConfirmExportWorkspace', () => {
    it('should export a workspace', () => {
      apiServiceSpy.exportWorkspaces.and.returnValue(of({}))
      component.exportMenu = true
      component.onConfirmExportWorkspace()

      expect(apiServiceSpy.exportWorkspaces).toHaveBeenCalled()
    })

    it('should enter error branch if exportWorkspaces call fails', () => {
      const errorResponse = { status: 400, statusText: 'Error on import menu items' }
      apiServiceSpy.exportWorkspaces.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.onConfirmExportWorkspace()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EXPORT.MESSAGE.NOK' })
      expect(console.error).toHaveBeenCalledWith('exportWorkspaces', errorResponse)
    })
  })

  it('should close the dialog', () => {
    spyOn(component.workspaceExportVisibleChange, 'emit')

    component.onClose()

    expect(component.workspaceExportVisibleChange.emit).toHaveBeenCalledWith(false)
  })
})
