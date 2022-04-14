import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { PLIconComponent } from '@root/src/lib-components/pl-icon/pl-icon.component';
import { PLBrowserService } from '@root/index';
import { PLSchoolYearsService } from '@root/src/app/common/services';
import { PLDotLoaderComponent } from '@root/src/lib-components/pl-dot-loader/pl-dot-loader.component';
import { PLSchoolyearSelectComponent } from '@root/src/app/common/components';
import { Spectator, createComponentFactory } from '@ngneat/spectator';

import { MockComponent } from 'ng-mocks';
import { PLLocationService } from '../pl-location.service';
import { PLLocationHandbookComponent } from './pl-location-handbook.component';
import { PLHandbookContentsComponent } from '../../handbook/pl-handbook-contents/pl-handbook-contents.component';
import { PLHandbookTextEditorComponent } from '../../handbook/pl-handbook-text-editor/pl-handbook-text-editor.component';

describe('PLLocationHandbookComponent', () => {
    let spectator: Spectator<PLLocationHandbookComponent>;

    const createComponent = createComponentFactory({
        component: PLLocationHandbookComponent,
        declarations: [
            MockComponent(PLDotLoaderComponent), MockComponent(PLSchoolyearSelectComponent),
            MockComponent(PLHandbookContentsComponent), MockComponent(PLHandbookTextEditorComponent),
            MockComponent(PLIconComponent),
        ],
        mocks: [
            Router, Store, PLBrowserService, PLLocationService, PLSchoolYearsService,
        ], // Providers that will automatically be mocked
        detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('should success', () => {
        expect(spectator).toBeTruthy();
    });

    describe('PL School Year', () => {
        let plSchoolYearSvcMock: any;

        const schoolYearEvt = {
            model: '2020-2021-regular',
            name: '2020-2021 School Year',
            oldVal: '2019-2020-regular',
        };
        const selectedSchoolYearFull = {
            code: '2020-2021-regular',
            endDate: '2021-07-31',
            id: 'e3bf4a96-4e1c-49d3-8921-2d89cb965dd9',
            isCurrent: false,
            name: '2020-2021 School Year',
            option: {
                value: '2020-2021-regular',
                label: '2020-2021 School Year',
            },
            startDate: '2020-08-01',
            startYear: 2020,
            yearType: 'REGULAR',
        };

        beforeEach(() => plSchoolYearSvcMock = spectator.get(PLSchoolYearsService));

        it('should update schoolYearId of handbookInfo when selecting a new school year', () => {
            plSchoolYearSvcMock.getYearForCode.and.returnValue(selectedSchoolYearFull);

            spectator.component.onYearSelected(schoolYearEvt);
            expect(spectator.component.handbookInfo.schoolYearId).toEqual(selectedSchoolYearFull.id);
        });

        it('should display error  on UI when school year event isn\'t valid', () => {
            const invalidEvents = [null, undefined, '', {}];

            invalidEvents.forEach((invalidEvent) => {
                spectator.component.onYearSelected(invalidEvent);

                expect(spectator.component.isLoading).not.toBeTruthy();
                expect(spectator.component.isOkForRender).not.toBeTruthy();
                expect(spectator.component.handbookInfo.schoolYearId).toEqual(null);
            });
        });

        it('should display error on UI when school year has no id', () => {
            const invalidValues = [null, undefined, '', {}];

            invalidValues.forEach((invalidValue) => {
                plSchoolYearSvcMock.getYearForCode.and.returnValue(invalidValue);

                spectator.component.onYearSelected(schoolYearEvt);

                expect(spectator.component.isLoading).not.toBeTruthy();
                expect(spectator.component.isOkForRender).not.toBeTruthy();
                expect(spectator.component.handbookInfo.schoolYearId).toEqual(null);
            });
        });
    });

    describe('PL Contents', () => {
        const contentEvent = {
            // checkout_by: null,
            // checkout_expires_on: null,
            data: `<p>Summary 2019-2020</p><p>More content <a title='TINY' href='https://www.tiny.cloud/docs/plugins/link/" target="_blank" rel="noopener">added</a> to this section.</p><p><a href="https://www.tiny.cloud/docs/plugins/link/">https://www.tiny.cloud/docs/plugins/link/</a></p><p>&nbsp;</p><p>&nbsp;</p>`,
            created: '2020-04-24T18:00:37.062687Z',
            handbookInfo: {
                schoolYearId: '80860e3d-d6ce-4a4c-abd0-6d33ec7759b8',
                orgId: '06603285-b993-44d9-9da1-158a236267ba',
                orgName: 'Chester Andover Elementary',
            },
            modified: '2020-06-19T17:12:39.004393Z',
            modified_by: { first_name: 'Ashley', last_name: 'Villanueva' },
            modified_by__uuid: '2444e708-16bc-3854-b76d-d8763090bbff',
            organization: '06603285-b993-44d9-9da1-158a236267ba',
            school_year: '80860e3d-d6ce-4a4c-abd0-6d33ec7759b8',
            section_type: {
                uuid: '5c2d4d9f-7c77-4045-89a7-022d42761f16',
                name: 'Summary',
                code: 'summary',
                number: 1,
                description: 'Describe the area, children, and services',
            },
            uuid: '5516b5bc-e09d-4681-8135-57d728845207',
        };

        it('should update contentToLoad and set loaded.contents to true when content event is valid', () => {
            const loaded = spyOn<any>(spectator.component, 'loaded');

            spectator.component.contentsEvent(contentEvent);

            expect(spectator.component.contentToLoad).toEqual(contentEvent);
            expect(loaded['contents']).toBeTruthy();
        });

        it('should display error on UI when content event is not valid', () => {
            const invalidEvents = [null, undefined, '', {}];

            invalidEvents.forEach((invalidEvent) => {
                spectator.component.contentsEvent(invalidEvent);
                expect(spectator.component.isLoading).not.toBeTruthy();
                expect(spectator.component.isOkForRender).not.toBeTruthy();
            });
        });

    });

    describe('CanActivate Guard', () => {
        const nextStateMock: any = {
            url: '/organization/06603285-b993-44d9-9da1-158a236267ba/documents#',
        };

        it('should allow routing when Text Editor is not activated', () => {
            spectator.component.disableSchoolYears = false;
            const returnedVal = spectator.component.canDeactivate(null, null, nextStateMock);
            expect(returnedVal).toBeTruthy();
        });

        it('should stop routing when Text Editor is activated', () => {
            spectator.component.disableSchoolYears = true;
            const returnedVal = spectator.component.canDeactivate(null, null, nextStateMock);
            expect(returnedVal).not.toBeTruthy();
        });
    });

    describe('Text Editor being Edited', () => {
        it('should enable/disable pl-schoolyear-select based on editor being edited or not', () => {
            let editorBeingEdited = true;

            for (let index = 0; index < 2; index++) {
                spectator.component.isEditorBeingEdited(editorBeingEdited);

                if (editorBeingEdited) {
                    expect(spectator.component.disableSchoolYears).toBeTruthy();
                } else {
                    expect(spectator.component.disableSchoolYears).not.toBeTruthy();
                }

                editorBeingEdited = !editorBeingEdited;
            }
        });

        it('should add event listener when editor is being edited', () => {
            const windowSpy = spyOn(window, 'addEventListener');
            spectator.component.isEditorBeingEdited(true);
            expect(windowSpy).toHaveBeenCalled();
        });

        it('should remove event listener when editor stops being edited', () => {
            const windowSpy = spyOn(window, 'removeEventListener');
            spectator.component.isEditorBeingEdited(false);
            expect(windowSpy).toHaveBeenCalled();
        });
    });
});
