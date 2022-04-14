import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'pl-record-captures-thumbnails',
    templateUrl: './pl-record-captures-thumbnails.component.html',
    styleUrls: ['./pl-record-captures-thumbnails.component.less'],
})
export class PLRecordCapturesThumbnailsComponent implements OnInit {
    @Input() thumbnailImg: string;
    @Input() hasMultipleCaptures: boolean;

    constructor() { }

    ngOnInit(): void { }
}
