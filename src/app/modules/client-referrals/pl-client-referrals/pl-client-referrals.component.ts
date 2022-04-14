import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { PLClientReferralsService } from '../pl-client-referrals.service';

@Component({
    selector: 'pl-client-referrals',
    templateUrl: './pl-client-referrals.component.html',
    styleUrls: ['./pl-client-referrals.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLClientReferralsComponent implements OnInit {
    tabs$: Observable<any[]>;

    constructor(private plClientReferrals: PLClientReferralsService) { }

    ngOnInit() {
        this.tabs$ = this.plClientReferrals.getTabs();
    }
}
