import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MockComponent } from 'ng-mocks';
import { createComponentFactory, Spectator } from '@ngneat/spectator';

import { PLClientRecordsListComponent } from './pl-client-records-list.component';

import { PLIconComponent } from '@root/src/lib-components/pl-icon/pl-icon.component';
import { PLTableRowComponent } from '@root/src/lib-components/pl-table-framework/pl-table-row.component';
import { PLTableCellComponent } from '@root/src/lib-components/pl-table-framework/pl-table-cell.component';
import { PLTableFooterComponent } from '@root/src/lib-components/pl-table-framework/pl-table-footer.component';
import { PLTableHeaderComponent } from '@root/src/lib-components/pl-table-framework/pl-table-header.component';
import { PLTableHeaderCellComponent } from '@root/src/lib-components/pl-table-framework/pl-table-header-cell.component';
import { PLTableWrapperComponent } from '@root/src/lib-components/pl-table-framework/pl-table-wrapper.component';

import {
    PLApiBillingCodesService, PLApiNotesSchemasService, PLHttpService,
    PLLodashService, PLTimezoneService, PLUrlsService,
} from '@root/src/lib-components';

describe('PLClientRecordsListComponent', () => {

    let spectator: Spectator<PLClientRecordsListComponent>;

    const storeStub = {
        select: (storeOpt: string) => {
            if (storeOpt === 'currentUser') {
                const user = {
                    first_name: 'John',
                    last_name: 'Doe',
                };

                return new Observable((observer: any) => {
                    observer.next(user);
                });
            }
        },
    };

    const store = { provide: Store, useValue: storeStub };
    const createComponent = createComponentFactory({
        component: PLClientRecordsListComponent,
        declarations: [
            MockComponent(PLTableHeaderCellComponent), MockComponent(PLTableHeaderComponent),
            MockComponent(PLTableCellComponent), MockComponent(PLIconComponent),
            MockComponent(PLTableRowComponent), MockComponent(PLTableFooterComponent),
            MockComponent(PLTableWrapperComponent),
        ],
        mocks: [
            PLHttpService, PLLodashService, PLTimezoneService, PLApiBillingCodesService,
            PLApiNotesSchemasService, PLUrlsService,
        ],
        providers: [store],
        detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('should success', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });

    describe('Client Table Correctly', () => {
        it('should display \'Discipline\' column as \'Group BMH\'BMH when short name from BE is \'GROUPBMH\' ', () => {
            const service = {
                service_expanded: {
                    service_type: {
                        short_name: 'GROUPBMH',
                    },
                },
            };

            const disciplineToDisplay = spectator.component.displayDiscipline(service);
            expect(disciplineToDisplay).toEqual('Group BMH');
        });

        it('should display the \'Service\' column with the service name or with N/A', () => {
            const svcWithName = {
                service_expanded: {
                    name: 'Behavior Intervention Group',
                },
            };
            const svcWithoutName = { service_expanded: { } };
            const svcArray = [svcWithName, svcWithoutName];
            const svcExpects = ['Behavior Intervention Group', 'N/A'];

            svcArray.forEach((svc, index) => {
                const svcToDisplay = spectator.component.displayService(svc);
                expect(svcToDisplay).toEqual(svcExpects[index]);
            });
        });
    });

});
