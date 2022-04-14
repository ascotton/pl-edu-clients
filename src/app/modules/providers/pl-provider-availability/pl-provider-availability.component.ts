import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PLDestroyComponent } from '@common/components';
import { first, takeUntil } from 'rxjs/operators';
import { PLProviderService } from '../pl-provider.service';

@Component({
    selector: 'pl-provider-availability',
    templateUrl: './pl-provider-availability.component.html',
})
export class PLProviderAvailabilityComponent extends PLDestroyComponent implements OnInit {
    showTabs = false;
    provider: any;
    loading = false;

    constructor(
        private router: Router,
        private plProvider: PLProviderService,
    ) {
        super();
    }

    ngOnInit(): void {
        const curUuid = this.router.url.split('/')[2];
        this.loading = true;
        this.plProvider.getProvider(curUuid).pipe(takeUntil(this.destroyed$), first())
            .subscribe((res: any) => {
                this.provider = res.provider;
                this.loading = false;
            });
    }
}
