import { ToastrService } from 'ngx-toastr';
import { PLISAService } from '../pl-isa.service';
import { MockComponent, MockModule } from 'ng-mocks';
import { PLDotLoaderModule, PLModalModule } from '@root/index';
import { PLISAHandlingComponent } from './pl-isa-handling.component';
import { Spectator, createComponentFactory } from '@ngneat/spectator';
import { PLISATableComponent } from '../pl-isa-table/pl-isa-table.component';
import { PLInputTextComponent } from '@root/src/lib-components/pl-input/pl-input-text.component';

describe('PLISAHandlingComponent', () => {

    const mockedISASvc = { provide: PLISAService, useValue: {} };
    const mockedToastrSvc = { provide: ToastrService, useValue: {} };

    let spectator: Spectator<PLISAHandlingComponent>;

    const createComponent = createComponentFactory({
        component: PLISAHandlingComponent,
        imports: [ 
            MockModule(PLModalModule),
            MockModule(PLDotLoaderModule),
        ],
        declarations: [ 
            MockComponent(PLISATableComponent),
            MockComponent(PLInputTextComponent),
        ],
        providers: [ mockedISASvc, mockedToastrSvc ],
        detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('should succeed', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });
});