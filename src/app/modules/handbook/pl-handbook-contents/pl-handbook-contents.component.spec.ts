import { PLUrlsService, PLHttpService } from '@root/index';
import { Spectator, createComponentFactory } from '@ngneat/spectator';

import { of } from 'rxjs';
import { Handbook } from '../handbook.model';
import { PLHandbookContentsComponent } from './pl-handbook-contents.component';

describe('PLHandbookContentsComponent', () => {
    let spectator: Spectator<PLHandbookContentsComponent>;
    const createComponent = createComponentFactory({
        component: PLHandbookContentsComponent,
        mocks: [PLUrlsService, PLHttpService],
    });

    beforeEach(() => spectator = createComponent());

    it('should success', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });

    describe('Load Content from Table of Contents', () => {
        let orderContentPropMock: any;
        let emitContentThroughEvtMock: any;
        let setActiveStateOnContentSectionMock: any;

        beforeEach(() => {
            orderContentPropMock = spyOn<any>(spectator.component, 'orderContentProperties');
            emitContentThroughEvtMock = spyOn<any>(spectator.component, 'emitContentThroughEvent');
            setActiveStateOnContentSectionMock = spyOn<any>(spectator.component, 'setActiveStateOnContentSection');
        });

        it('should not load content when content is not valid', () => {
            const invalidContent = [null, undefined, {}];

            invalidContent.forEach((invalid) => {
                spectator.component.loadContent(invalid, 0);
                expect(orderContentPropMock).not.toHaveBeenCalled();
            });
        });

        describe('Valid Content', () => {
            const handbookInfoMock: Handbook = {
                orgId: '06603285-b993-44d9-9da1-158a236267ba',
                orgName: 'Dummy Name',
                schoolYearId: '80860e3d-d6ce-4a4c-abd0-6d33ec7759b8',
            };
            const contentToLoadMock = {
                // checkout_by: null,
                // checkout_expires_on: null,
                created: '2020-04-29T21:39:36.558515Z',
                data: '<p>Content added to this other section</p>↵<p>Content added to this other section</p>↵<p>Content added to this other section</p>',
                modified: '2020-06-18T18:58:59.356732Z',
                modified_by: { first_name: 'Ashley', last_name: 'Villanueva' },
                modified_by__uuid: '2444e708-16bc-3854-b76d-d8763090bbff',
                organization: '06603285-b993-44d9-9da1-158a236267ba',
                school_year: '80860e3d-d6ce-4a4c-abd0-6d33ec7759b8',
                section_type: { uuid: '61475832-29e1-4a0b-945d-87a4d227ce69', name: 'IEP Access & Training', code: 'iep_access' },
                uuid: 'd8d3d459-60b2-4b5f-9839-2ce5eb1b0f5d',
            };

            it('should emitContentThroughEvent twice', () => {
                const plUrlsSvcMock = spectator.get(PLUrlsService);
                const plHttpSvcMock = spectator.get(PLHttpService);

                plHttpSvcMock.get.and.returnValue(of({}));
                plUrlsSvcMock.urls = { handbookSection: '/mockedUrl' };

                spectator.component.handbookInfo = handbookInfoMock;
                spectator.component.loadContent(contentToLoadMock, 1);

                expect(orderContentPropMock).toHaveBeenCalledTimes(2);
                expect(emitContentThroughEvtMock).toHaveBeenCalledTimes(2);
                expect(setActiveStateOnContentSectionMock).toHaveBeenCalledTimes(1);
            });
        });
    });
});
