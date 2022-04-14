import { Component, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { from } from 'rxjs';

import { PLClientContactSaveComponent } from './pl-client-contact-save.component';
import { PLDotLoaderModule, PLInputModule } from '@root/index';
import {
    PLHttpService,
    PLToastService,
    PLApiContactTypesService,
    PLApiLanguagesService,
    PLApiUsStatesService,
    PLFormService,
} from '@root/index';

import { Store } from '@ngrx/store';
import { storeStub } from '@app/stores/store.stub';

describe('PLClientContactSaveComponent', () => {
    @Component({
        selector: 'host-component',
        template: `<pl-client-contact-save [contact]="contact"></pl-client-contact-save>`,
    })
    class HostComponent {
        contact = {};
    }

    let hostComponent: HostComponent;
    let component: PLClientContactSaveComponent;
    let fixture: ComponentFixture<HostComponent>;
    let saveButton: any;

    let httpServiceStub: any = {
        save: () => from([]),
    };
    let toastServiceStub: any = {};
    let contactTypesServiceStub: any = {
        formOpts: (): any[] => [],
    };
    let languagesServiceStub: any = {
        formOpts: (): any[] => [],
    };
    let usStatesServiceStub: any = {
        getOptsGQL: (): any[] => [],
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, PLDotLoaderModule, PLInputModule],
            declarations: [HostComponent, PLClientContactSaveComponent],
            providers: [
                {provide: PLHttpService, useValue: httpServiceStub},
                {provide: Store, useValue: storeStub},
                {provide: PLToastService, useValue: toastServiceStub},
                {provide: PLApiContactTypesService, useValue: contactTypesServiceStub},
                {provide: PLApiLanguagesService, useValue: languagesServiceStub},
                {provide: PLApiUsStatesService, useValue: usStatesServiceStub},
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HostComponent);
        hostComponent = fixture.debugElement.componentInstance;
        component = fixture.debugElement.query(By.css('pl-client-contact-save')).componentInstance;

        fixture.detectChanges();

        saveButton = fixture.debugElement.query(By.css('button.x-qa-save-contact-button'));
    });

    describe('save button', () => {
        let httpStub: any;

        beforeEach(() => {
            httpStub = fixture.debugElement.injector.get(PLHttpService);
            spyOn(httpStub, 'save').and.callThrough();
        });

        it('will be disabled by default', () => {
            expect(saveButton.nativeElement.disabled).toBeTruthy();
        });

        it('will be enabled if form has been touched', () => {
            component.contactSaveForm.markAsTouched();

            fixture.detectChanges();

            expect(saveButton.nativeElement.disabled).toBeFalsy();
        });

        it('will save the contact if form is valid', () => {
            spyOnProperty(component.contactSaveForm, 'valid', 'get').and.returnValue(true);

            saveButton.triggerEventHandler('click', {});

            expect(httpStub.save).toHaveBeenCalled()
        });

        it('will not save the contact if form is invalid', () => {
            spyOnProperty(component.contactSaveForm, 'valid', 'get').and.returnValue(false);

            saveButton.triggerEventHandler('click', {});

            expect(httpStub.save).not.toHaveBeenCalled()
        });

        it('will cause all form fields to be touched', () => {
            spyOn(PLFormService, 'markAllAsTouched').and.stub();

            saveButton.triggerEventHandler('click', {});

            expect(PLFormService.markAllAsTouched).toHaveBeenCalledWith(component.contactSaveForm);
        });
    });

    describe('contactRelationship', () => {
        describe('changes', () => {
            it('will reflect contact is_emergency', () => {
                hostComponent.contact = { is_emergency: true };

                fixture.detectChanges();

                expect(component.contactRelationship).toContain('emergency_contact');
            });

            it('will reflect contact is_responsible_party', () => {
                hostComponent.contact = { is_responsible_party: true };

                fixture.detectChanges();

                expect(component.contactRelationship).toContain('learning_coach');
            });
        });

        describe('when submitted', () => {
            let httpStub: any;

            const contactsApiParams = () => httpStub.save.calls.argsFor(0)[1];

            beforeEach(() => {
                spyOnProperty(component.contactSaveForm, 'valid', 'get').and.returnValue(true);

                httpStub = fixture.debugElement.injector.get(PLHttpService);
                spyOn(httpStub, 'save').and.callThrough();
            });

            it('will be reflected in contact is_emergency', () => {
                component.contactRelationship.push('emergency_contact');

                saveButton.triggerEventHandler('click', {});

                expect(contactsApiParams().is_emergency).toBe(true);
            });

            it('will be reflected in contact is_responsible party', () => {
                component.contactRelationship.push('learning_coach');

                saveButton.triggerEventHandler('click', {});

                expect(contactsApiParams().is_responsible_party).toBe(true);
            });
        });
    });
});
