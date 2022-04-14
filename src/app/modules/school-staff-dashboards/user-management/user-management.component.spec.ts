import { MockComponent, MockModule, MockService } from "ng-mocks";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserManagementComponent } from "./user-management.component";
import { createComponentFactory, Spectator } from "@ngneat/spectator";
import { PLPlatformLicensesComponent } from "../platform-dashboard/platform-licenses/platform-licenses.component";
import { DashboardTableComponent } from "../dashboard-table/dashboard-table.component";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { PLPlatformHelperService, PLSchoolStaffService } from "../services";


describe('UserManagementComponent', () => {
    let spectator: Spectator<UserManagementComponent>;

    const storeStub = {
        select: () => {
            return new Observable((observer: any) => {
                observer.next(null);
            });
        },
    };

    const mockedStore = { provide: Store, useValue: storeStub };
    const mockedMatDialog = { provide: MatDialog, useValue: {} };
    const mockedPLSchoolStaffSvc = { provide: PLSchoolStaffService, useValue: MockService(PLSchoolStaffService) };
    const mockedPLPlatformHelperSvc = { provide: PLPlatformHelperService, useValue: MockService(PLPlatformHelperService) };

    const createComponent = createComponentFactory({
        component: UserManagementComponent,
        imports: [
            MockModule(FormsModule),
            MockModule(MatIconModule),
            MockModule(MatFormFieldModule),
            MockModule(ReactiveFormsModule),
            MockModule(MatSlideToggleModule),
        ],
        declarations: [
            MockComponent(PLPlatformLicensesComponent),
            MockComponent(DashboardTableComponent),
        ],
        providers: [
            mockedStore,
            mockedMatDialog,
            mockedPLSchoolStaffSvc,
            mockedPLPlatformHelperSvc,
        ],
        detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('should succeed', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });
});
