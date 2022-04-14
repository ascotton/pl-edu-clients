import { Component, OnInit } from '@angular/core';
import { PLClientMergeService } from '../pl-client-merge.service';

@Component({
    selector: 'pl-merge-complete',
    templateUrl: './pl-merge-complete.component.html',
    styleUrls: ['./pl-merge-complete.component.less'],
})
export class PLMergeCompleteComponent implements OnInit {

    client: any = {};

    constructor(private clientMergeService: PLClientMergeService) {
        this.client = clientMergeService.resultClient;
        this.client.fullName = `${this.client.firstName} ${this.client.lastName}`;
        this.client.locationName = clientMergeService.updateValuesFormatted.locationName;
    }

    ngOnInit() {
        this.clientMergeService.mergeComplete = true;
    }

    resetData() {
        this.clientMergeService.resetData();
    }

}
