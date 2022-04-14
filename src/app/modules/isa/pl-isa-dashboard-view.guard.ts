import { Observable } from 'rxjs';
import { ISAFeatureStates } from '.';
import { Injectable } from '@angular/core';
import { PLISAService } from './pl-isa.service';
import { catchError, first, map } from 'rxjs/operators';
import { 
    CanActivate, ActivatedRouteSnapshot,
    RouterStateSnapshot, UrlTree, Router, 
} from '@angular/router';

@Injectable()
export class PlISADashboardViewGuard implements CanActivate {
    constructor(
      private router: Router,
      private plISASvc: PLISAService,
    ) { }
  
    canActivate( next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        if (this.plISASvc.isasFeatureState === ISAFeatureStates.notChecked) {
            return this.plISASvc.isISAFeatureEnabled().pipe(
                map((isas: {featureState: ISAFeatureStates}) => this.allowAccessOrRedirect(isas.featureState === ISAFeatureStates.available)),
                catchError(() => this.router.navigate(['/dashboard/'])),
                first(),
            );
        } else if (this.plISASvc.isasFeatureState === ISAFeatureStates.unavailable) {
            this.router.navigate(['/dashboard/']);
        } else {
            return this.allowAccessOrRedirect(true);
        }
    }

    private allowAccessOrRedirect(isFeatureAvailable: boolean) {
         if ( isFeatureAvailable && this.plISASvc.isUserAssignedToOneSchoolOrCurrentSchoolHasISAs() ) return true; 
         this.router.navigate(['/dashboard/']);
    }
  
}
