import { MatIconModule } from '@angular/material/icon'; 
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MockModule } from 'ng-mocks';
import { PLUrlsService } from '@root/index';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DashboardTableComponent } from './dashboard-table.component';

describe('DashboardTableComponent', () => {
    let spectator: Spectator<DashboardTableComponent>;
    const mockedPLUrlsSvc = { 
        provide: PLUrlsService, 
        useValue: {
            urls: { roomFE: ''}
        } 
    };

    const createComponent = createComponentFactory({
        component: DashboardTableComponent,
        imports: [
            MockModule(NoopAnimationsModule),
            MockModule(MatPaginatorModule),
            MockModule(MatSortModule),
            MockModule(MatTableModule),
            MockModule(MatIconModule),
            MockModule(MatButtonModule),
            MockModule(MatMenuModule),
            MockModule(MatProgressBarModule),
        ],
        providers: [
          mockedPLUrlsSvc,
        ],
        detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('should succeed', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });
});
