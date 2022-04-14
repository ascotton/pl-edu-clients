import { MockModule } from 'ng-mocks';
import { PLISAService } from '../pl-isa.service';
import { PLSchoolYearsService } from '@root/src/app/common/services';
import { Spectator, createComponentFactory } from '@ngneat/spectator';
import { PLISATableComponent } from '../pl-isa-table/pl-isa-table.component';
import { PLGQLProviderTypesService, PLLodashService, PLTableFrameworkModule } from '@root/index';

describe('PLISATableComponent', () => {

    const mockedISASvc = { provide: PLISAService, useValue: {} };
    const mockedLodashSvc = { provide: PLLodashService, useValue: {} };
    const mockedSYSvc = { provide: PLSchoolYearsService, useValue: {} };
    const mockedGQLProviderTypeSvc = { provide: PLGQLProviderTypesService, useValue: {} };

    let spectator: Spectator<PLISATableComponent>;

    const createComponent = createComponentFactory({
        component: PLISATableComponent,
        imports: [ 
            MockModule(PLTableFrameworkModule),
        ],
        providers: [ mockedISASvc, mockedLodashSvc,  mockedSYSvc, mockedGQLProviderTypeSvc],
        detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('should succeed', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });
});