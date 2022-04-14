import { Router } from '@angular/router';
import { PLISAService } from '../pl-isa.service';
import { MockComponent, MockModule } from 'ng-mocks';
import { Spectator, createComponentFactory } from '@ngneat/spectator';
import { PLISADashboardComponent } from './pl-isa-dashboard.component';
import { PLDotLoaderModule } from '@root/src/lib-components/pl-dot-loader';
import { PLISATableComponent } from '../pl-isa-table/pl-isa-table.component';
import { PLModalService } from '@root/src/lib-components/pl-modal/pl-modal.service';

describe('PLISADashboardComponent', () => {

    const mockedRouter = { provide: Router, useValue: {} };
    const mockedISASvc = { provide: PLISAService, useValue: {} };
    const mockedModalSvc = { provide: PLModalService, useValue: {} };

    let spectator: Spectator<PLISADashboardComponent>;

    const createComponent = createComponentFactory({
        component: PLISADashboardComponent,
        imports: [ MockModule(PLDotLoaderModule) ],
        declarations: [ MockComponent(PLISATableComponent) ],
        providers: [mockedRouter, mockedISASvc, mockedModalSvc],
        detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('should succeed', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });
});