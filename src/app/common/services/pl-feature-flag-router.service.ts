import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PLFeatureFlagService } from './pl-feature-flag.service';

@Injectable()
export class PLFeatureFlagRouterService implements CanActivate {

    constructor(private plFeatureFlagService: PLFeatureFlagService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (state.url.indexOf('assignment-manager') > 0) {
            return this.plFeatureFlagService.canUseP934AssignmentManager();
        }

        if (state.url.indexOf('assignments') > 0) {
            return this.plFeatureFlagService.canUseP934ProviderAssignments();
        }

        if (state.url.indexOf('cam-dashboard') > 0) {
            return this.plFeatureFlagService.canUseP934CamDashboard();
        }
    }
}
