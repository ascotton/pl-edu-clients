import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

/**
 * In addition to inclusion here, new feature flags should be set in the relevant config files in:
 * config/env/[environment].js
 * The template in config/env-config-file.js should also be updated to pull in the relevant flag
 * when environment.*.ts are built.
 */


@Injectable()
export class PLFeatureFlagService {
    readonly FLAG_USE_P934_CAM_DASHBOARD = 'FLAG_USE_P934_CAM_DASHBOARD';
    readonly FLAG_USE_P934_ASSIGNMENT_MANAGER = 'FLAG_USE_P934_ASSIGNMENT_MANAGER';
    readonly FLAG_USE_P934_PROVIDER_ASSIGNMENTS = 'FLAG_USE_P934_PROVIDER_ASSIGNMENTS';

    public canUseP934CamDashboard(): boolean {
        return this.isEnabled(this.FLAG_USE_P934_CAM_DASHBOARD);
    }

    public canUseP934AssignmentManager(): boolean {
        return this.isEnabled(this.FLAG_USE_P934_ASSIGNMENT_MANAGER);
    }

    public canUseP934ProviderAssignments(): boolean {
        return this.isEnabled(this.FLAG_USE_P934_PROVIDER_ASSIGNMENTS);
    }

    public isEnabled(flag: string): boolean {
        const local = localStorage.getItem(flag);
        return local ? local === 'true' : environment[flag];
    }
}
