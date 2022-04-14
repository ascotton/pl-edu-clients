import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { MockComponent, MockModule, MockService } from 'ng-mocks';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PLUserGuidingService } from '@root/src/app/common/services';
import { PLDesignService } from '@root/src/app/common/services/pl-design.service';
import { PLSidenavComponent } from '../components/pl-sidenav/pl-sidenav.component';
import { PLDistrictAdminLayoutComponent } from './district-admin-layout.component';
import { MatFormFieldModule, MatIconModule, MatSelectModule } from '@angular/material';

describe('PLDistrictAdminLayoutComponent', () => {

    let spectator: Spectator<PLDistrictAdminLayoutComponent>;

    const storeStub = {
        select: () => {
            return new Observable((observer: any) => {
                observer.next(null);
            });
        },
    };

    const mockedStore = { provide: Store, useValue: storeStub };
    
    const mockedRouter = { provide: Router, useValue: {} };
    const mockedActivatedRoute = { provide: ActivatedRoute, useValue: {} };

    const mockedPLDesignSvc = { provide: PLDesignService, useValue: {} };
    const mockedPLNavHelperSvc = { provide: PLUserGuidingService, useValue: {} };
    
    const createComponent = createComponentFactory({
        component: PLDistrictAdminLayoutComponent,
        imports: [
            MockModule(MatFormFieldModule),
            MockModule(MatIconModule),
            MockModule(MatSelectModule),
            MockModule(RouterModule),
        ],
        declarations: [
            MockComponent(PLSidenavComponent),
        ],
        providers: [
            mockedRouter,
            mockedActivatedRoute,
            mockedStore,
            mockedPLDesignSvc,
            mockedPLNavHelperSvc,
        ],
        detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('should succeed', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });
});
