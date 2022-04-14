import { Component, OnInit } from '@angular/core';
import { PLClientMergeService } from '../pl-client-merge.service';

@Component({
    selector: 'pl-confirm-clients',
    templateUrl: './pl-confirm-clients.component.html',
    styleUrls: ['../pl-compare-clients/pl-compare-clients.component.less', './pl-confirm-clients.component.less'],
})
export class PLConfirmClientsComponent implements OnInit {

    update: any;
    updateFormatted: any;

    constructor(private clientMergeService: PLClientMergeService) {
        this.update = clientMergeService.updateValues;
        this.updateFormatted = clientMergeService.updateValuesFormatted;
    }

    ngOnInit() {
    }

}
