import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';

import { PLDocumentsModule } from '../index';
import { PLDocumentUploadComponent } from './pl-document-upload.component';

import {
    PLApiDocumentTypesService,
    PLApiClientServicesService,
    PLFormService,
    PLToastService,
    PLLodashService,
    PLApiServiceUploadDocumentsService,
    PLMayService,
} from '@root/index';

import { storeStub } from '@app/stores/store.stub';

describe('PLDocumentUploadComponent', () => {
    let component: PLDocumentUploadComponent;
    let fixture: ComponentFixture<PLDocumentUploadComponent>;
    let uploadButton: any;

    const plApiDocumentTypesServiceStub: any = {
        get: () => EMPTY,
    };

    const plApiClientServicesServiceStub: any = {
        get: () => EMPTY,
    };

    const toastServiceStub: any = {
        show: () => 0,
    };

    const plApiServiceUploadDocumentsServiceStub = {
        saveType: () => 0,
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [PLDocumentsModule],
            providers: [
                { provide: PLApiDocumentTypesService, useValue: plApiDocumentTypesServiceStub },
                { provide: PLApiClientServicesService, useValue: plApiClientServicesServiceStub },
                { provide: PLToastService, useValue: toastServiceStub },
                PLLodashService,
                { provide: PLApiServiceUploadDocumentsService, useValue: plApiServiceUploadDocumentsServiceStub },
                { provide: Store, useValue: storeStub },
                PLMayService,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PLDocumentUploadComponent);
        component = fixture.debugElement.componentInstance;

        fixture.detectChanges();

        uploadButton = fixture.debugElement.query(By.css('button.x-qa-upload-document-btn'));
    });

    describe('save button', () => {
        let uploadDocServiceStub: any;

        it('will be enabled when form is touched', () => {
            component.documentUploadForm.markAsTouched();

            fixture.detectChanges();

            expect(uploadButton.nativeElement.disabled).toBeFalsy();
        });

        it('will cause all form fields to be touched', () => {
            spyOn(PLFormService, 'markAllAsTouched').and.stub();

            uploadButton.triggerEventHandler('click', {});

            expect(PLFormService.markAllAsTouched).toHaveBeenCalledWith(component.documentUploadForm);
        });

        describe('validate', () => {
            // Note: this is an internal function and in general shouldn't be tested, but I
            // wanted to make the validation tests below more readable and maintainable.
            // Those tests mock the validate() function that is under test here. (ms)

            it('is true when clientService exists', () => {
                const model = { clientService: {} };

                expect(component.validate(model)).toBeTruthy();
            });

            it('is false when type is evaluation_report', () => {
                const model = { type: 'evaluation_report' };

                expect(component.validate(model)).toBeFalsy();
            });

            it('is false when type is school_consent_form', () => {
                const model = { type: 'school_consent_form' };

                expect(component.validate(model)).toBeFalsy();
            });

            it('is true when type is something else', () => {
                const model = { type: 'some-other-value' };

                expect(component.validate(model)).toBeTruthy();
            });
        });

        describe('upload', () => {
            beforeEach(() => {
                uploadDocServiceStub = fixture.debugElement.injector.get(PLApiServiceUploadDocumentsService);

                spyOn(uploadDocServiceStub, 'saveType').and.returnValue(EMPTY);
                component.model = { file: { file: '' }, type: '' };
                spyOn(component, 'formFullDocumentPath').and.returnValue('');
            });

            describe('will validate and', () => {
                it('will save when form and model are valid', () => {
                    spyOnProperty(component.documentUploadForm, 'valid', 'get').and.returnValue(true);
                    spyOn(component, 'validate').and.returnValue(true);

                    uploadButton.triggerEventHandler('click', {});

                    expect(uploadDocServiceStub.saveType).toHaveBeenCalled();
                });

                it('will not save when form is invalid', () => {
                    spyOnProperty(component.documentUploadForm, 'valid', 'get').and.returnValue(false);
                    spyOn(component, 'validate').and.returnValue(true);

                    uploadButton.triggerEventHandler('click', {});

                    expect(uploadDocServiceStub.saveType).not.toHaveBeenCalled();
                });

                it('will not save when model is invalid', () => {
                    spyOnProperty(component.documentUploadForm, 'valid', 'get').and.returnValue(false);
                    spyOn(component, 'validate').and.returnValue(false);

                    uploadButton.triggerEventHandler('click', {});

                    expect(uploadDocServiceStub.saveType).not.toHaveBeenCalled();
                });
            });
        });
    });
});
