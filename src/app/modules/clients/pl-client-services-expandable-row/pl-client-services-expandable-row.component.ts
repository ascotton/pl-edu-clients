import {
    Component,
    Input,
    ElementRef,
    AfterViewInit,
    ContentChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'pl-client-services-expandable-row',
    templateUrl: './pl-client-services-expandable-row.component.html',
})
export class PLClientServicesExpandableRowComponent implements AfterViewInit {
    @Input() rowId: string;
    @Input() queryParam: string;

    @ContentChild('expandButton', { static: true }) expandButtonRef: ElementRef;

    constructor(private activatedRoute: ActivatedRoute) { }

    ngAfterViewInit(): void {
        this.expandOnQueryParam();
    }

    expandOnQueryParam(): void {
        const rowId = this.activatedRoute.snapshot.queryParamMap.get(this.queryParam);
        if (rowId === this.rowId) {
            setTimeout(() => {
                this.expandButtonRef.nativeElement.click();
            }, 0);
            this.scrollIntoView();
        }
    }

    scrollIntoView(): void {
        setTimeout(() => {
            this.expandButtonRef.nativeElement.scrollIntoView(
                {
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
        }, 0);
    }
}
