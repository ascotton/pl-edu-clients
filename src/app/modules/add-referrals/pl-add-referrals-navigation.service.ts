import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class PLAddReferralsNavigationService {

    uploadComplete = false;
    showNavigation = true;

    constructor() {
    }

    private navigateRequested = new Subject<number>();
    private navigateConfirmed = new Subject<number>();

    navigateRequested$ = this.navigateRequested.asObservable();
    navigateConfirmed$ = this.navigateConfirmed.asObservable();

    requestNavigate(stepIndex: number) {
        this.navigateRequested.next(stepIndex);
    }
    confirmNavigate(stepIndex: number) {
        this.navigateConfirmed.next(stepIndex);
    }
}
