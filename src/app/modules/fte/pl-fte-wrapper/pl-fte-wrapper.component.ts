import { ActivatedRoute } from '@angular/router';
import { Component, Input, OnInit } from '@angular/core';

import { PLUrlsService } from '@root/index';

@Component({
    selector: 'pl-fte-wrapper',
    templateUrl: './pl-fte-wrapper.component.html',
    styleUrls: ['./pl-fte-wrapper.component.less'],
})
export class PLFTEWrapperComponent implements OnInit {
    @Input() fteInCalendarProps: { inCalendarWeekView: boolean, weekDate: string } = {
        inCalendarWeekView: false,
        weekDate: '',
    };

    headerText = 'Contract Service Hours';
    
    showFTE = false;
    showTips = {
        onboarding: false,
        tasks: false,
        availability: false,
        schedule: false,
        fte: false,
        room: false,
    };

    scheduleUrl: string = null;

    constructor(private activatedRoute: ActivatedRoute, private plUrls: PLUrlsService) { }

    ngOnInit() {
        this.activatedRoute.url.subscribe(
            (urlSegment) => {
                if (urlSegment[0].path === 'landing') {
                    this.scheduleUrl = this.plUrls.urls.scheduleFE;
                    this.headerText = 'Scheduled Contract Service Hours';
                }
            },
        );
    }

    displayFTEHours(info: any) {
        this.showFTE = info.showFTE;
    }

    toggleShowTips(key: string) {
        this.showTips[key] = !this.showTips[key];
    }

}
