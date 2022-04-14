import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PLHandbookTextEditorComponent } from './pl-handbook-text-editor.component';
import { EditorModule } from '@tinymce/tinymce-angular';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
    PLUrlsService, PLHttpService, PLTimezoneService,
    PLConfirmDialogService, PLModalService, PLDotLoaderModule,
    PLIconModule,
} from '@root/index';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

describe('PLHandbookTextEditorComponent', () => {

    const storeStub = {
        select: (storeOpt: string) => {
            switch (storeOpt) {
                    case 'currentUser':
                        const user = {
                            first_name: 'John',
                            last_name: 'Doe',
                        };

                        return new Observable((observer: any) => {
                            observer.next(user);
                        });

                    case 'handbookRoutingActionStore':
                        return new Observable((observer: any) => {
                            observer.next(null);
                        });
            }
        },
    };

    const plUrlSvcStub = {
        urls: {
            handbookSection: 'https://mijael-supv-bigs.workplace.presencestag.com/api/v1/handbooksection/',
        },
    };

    const plHttpSvcStub = {
        get: (urlKey: string, param: any, url: string) => {
            return new Observable((observer: any) => {
                observer.next({
                    checkout_by: {
                        first_name: 'John',
                        last_name: 'Doe',
                    },
                });
            });
        },
    };

    const plTimezoneSvcStub = {
        getUserZone: () => '',
    };

    let component: PLHandbookTextEditorComponent;
    let fixture: ComponentFixture<PLHandbookTextEditorComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, EditorModule,
                PLDotLoaderModule, PLIconModule],
            providers: [
                { provide: Store, useValue: storeStub },
                { provide: PLUrlsService, useValue: plUrlSvcStub },
                { provide: PLHttpService, useValue: plHttpSvcStub },
                { provide: PLTimezoneService, useValue: plTimezoneSvcStub },
                { provide: PLConfirmDialogService, useValue: {} },
                { provide: PLModalService, useValue: {} },
                { provide: ToastrService, useValue: {} },
            ],
            declarations: [PLHandbookTextEditorComponent],
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PLHandbookTextEditorComponent);
        component = fixture.componentInstance;
        // fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Edit Button Availability', () => {
        let editFunctionMock: any;

        beforeEach(() => {
            component.contentToLoad = {
                school_year: 'b5bfb502-7858-4966-8e5a-b9fe72b7e75d',
                section_type: {
                    uuid: '0850d44b-c16b-4d35-8541-8dcb46b72960',
                },
                handbookInfo: {
                    orgId: 'ccb8850b-286d-4609-98e3-6e00060fe6a5',
                },
            };

            editFunctionMock = spyOn<any>(component, 'edit');
        });

        it('should call \'edit\' function when user is valid for editing', () => {
            component.currentUser.firstName = 'John';
            component.currentUser.lastName = 'Doe';

            component.checkEditAvailability();

            expect(editFunctionMock).toHaveBeenCalled();
        });

        it('should not call \'edit\' function and call \'disableEditButton\' function when user is not valid for editing', () => {
            component.currentUser.firstName = 'Juan';
            component.currentUser.lastName = 'Do';

            component.checkEditAvailability();

            expect(editFunctionMock).not.toHaveBeenCalled();
            expect(component.isCheckedOut).toBeTruthy();
            expect(component.isLoading).toBeFalsy();
        });
    });
});
