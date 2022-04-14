import { Component, Input } from '@angular/core';

import { PLStatusDisplayService } from '@common/services/';

@Component({
    selector: 'pl-status-help',
    templateUrl: './pl-status-help.component.html',
    styleUrls: ['./pl-status-help.component.less'],
})
export class PLStatusHelpComponent {
    @Input() onCancel: Function;
    @Input() modalHeaderText: string;
    @Input() introductionText: string;
    @Input() definitionHeaderText: string;
    @Input() statusNames: any[] = [];
    statuses: any[] = [];

    constructor(private plStatusDisplayService: PLStatusDisplayService) {
    }

    ngOnInit() {
        this.statuses = [];
        this.statusNames.forEach( (name: string) => {
            this.statuses.push(this.plStatusDisplayService.getStatusDisplayObject(name));
        });
    }

    cancel() {
        this.onCancel();
    }

}
