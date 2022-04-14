import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'pl-merge-tips',
    templateUrl: './pl-merge-tips.component.html',
    styleUrls: ['./pl-merge-tips.component.less'],
})
export class PLMergeTipsComponent implements OnInit {
    currentTip: number = 1;

    constructor() {
    }

    ngOnInit() {
    }
}
