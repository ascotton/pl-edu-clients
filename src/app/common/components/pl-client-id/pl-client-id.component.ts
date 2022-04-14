import { Component, Input } from '@angular/core';

import { PLClientIdService } from '@common/services/pl-client-id.service';

@Component({
    selector: 'pl-client-id',
    templateUrl: './pl-client-id.component.html',
    styleUrls: ['./pl-client-id.component.less'],
})
export class PLClientIdComponent {
    @Input() externalId: string;
    @Input() internalId: string;
    @Input() linkTarget: string = '_self';

    mode: string = '';

    constructor() {}

    ngOnInit() {
        this.updateMode();
    }

    ngOnChanges() {
        this.updateMode();
    }

    updateMode() {
        this.mode = PLClientIdService.getModeFromId(this.externalId);
    }
}
