import { Store } from "@ngrx/store";
import { Observable, throwError } from "rxjs";
import { MatDividerModule } from '@angular/material/divider';
import { MockService, MockModule, MockComponent } from "ng-mocks";
import { createComponentFactory, Spectator } from "@ngneat/spectator";
import { PLDataLoaderComponent } from "@root/src/app/common/components";
import { PLPlatformHelperService, PLSchoolStaffService } from "../services";
import { PLPlatformDashboardComponent, PLPlatformLicensesComponent } from ".";
import { PLPlatformUserActivityComponent } from "../platform-user-activity/platform-user-activity.component";
import { PLTrainingGraphsComponent } from "../training-graphs/training-graphs.component";


describe('PLPlatformDashboardComponent', () => {
    let spectator: Spectator<PLPlatformDashboardComponent>;

    const storeStub = {
        select: () => {
            return new Observable((observer: any) => {
                observer.next(null);
            });
        },
    }

    const plPlatformHelperStub = {
        reFetch: () => {
            return new Observable((observer: any) => {
                throw throwError('error'); // Add logic later on
            });
        },
    };

    const mockedStore = { provide: Store, useValue: storeStub };
    const mockedPLPlatformHelperSvc = { provide: PLPlatformHelperService, useValue: plPlatformHelperStub };
    const mockedPLSchoolStaffSvc = { provide: PLSchoolStaffService, useValue: MockService(PLSchoolStaffService) };

    const createComponent = createComponentFactory({
        component: PLPlatformDashboardComponent,
        imports: [
            MockModule(MatDividerModule),
        ],
        declarations: [
            MockComponent(PLPlatformUserActivityComponent),
            MockComponent(PLDataLoaderComponent),
            MockComponent(PLPlatformLicensesComponent),
            MockComponent(PLTrainingGraphsComponent),
        ],
        providers: [
            mockedStore,
            mockedPLSchoolStaffSvc,
            mockedPLPlatformHelperSvc,
        ]
    });

    beforeEach(() => spectator = createComponent());

    it('should succeed', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });
});
