import { Component, Input } from '@angular/core';

import { PLBillingCode } from '@common/interfaces';
import { Store } from '@ngrx/store';
import { AppStore } from '@root/src/app/appstore.model';
import { PLEventRepeatMode } from '../../models';
import { PLSaveEvent, ScheduleEffects } from '../../store/schedule';

@Component({
    selector: 'pl-select-billing-code',
    templateUrl: './pl-select-billing-code.component.html',
    styleUrls: ['./pl-select-billing-code.component.less'],
})
export class PLSelectBillingCodeComponent {
    @Input() onSaveComplete: Function;
    @Input() onCancel: Function;
    @Input() billingCodes: PLBillingCode[];
    @Input() selectedCode: any;
    @Input() selectedItems: any;

    billingCodeOpts: any = [];
    areYouSure = false;
    showProgress = false;
    selectedItemsCount = 0;
    updatedCount = 0;

    constructor(
        private store$: Store<AppStore>,
        private scheduleEffects: ScheduleEffects,
    ) {
    }

    ngOnInit() {
        this.selectedItemsCount = this.selectedItems.length;
        this.billingCodeOpts = this.billingCodes
            .filter((bc: any) => VALID_CODES.includes(bc.code))
            .map((bc: any) => {
                return { value: bc.code, label: bc.name };
            })
            .sort((a: any, b: any) => a.label.localeCompare(b.label))
        ;
    }

    onClickBulkUpdate() {
        this.areYouSure = true;
    }

    onClickSave() {
        this.areYouSure = false;
        this.showProgress = true;

        const billing_code = this.billingCodes.find(bc => bc.code === this.selectedCode);
        if (!billing_code) return;

        // kick off the update
        this.updateBulkEditSelectedItem(billing_code);

        // wait for completion
        this.scheduleEffects.eventSaved$.subscribe(
            (payload: any) => {
                this.updatedCount++;

                // kick off the next one
                this.updateBulkEditSelectedItem(billing_code);
            },
        );
    }

    private updateBulkEditSelectedItem(billing_code: any): any {
        // update the first remaining selected item
        if (this.selectedItems.length === 0) return null;
        const item = this.selectedItems.shift();

        // kick off the update
        const instance = item.instance;
        const event = instance.event;
        const workingEvent = { ...event };

        workingEvent.billing_code = billing_code.uuid;
        workingEvent.billing_expanded = billing_code;

        this.store$.dispatch(PLSaveEvent({
            payload: {
                document: false,
                keepOpen: false,
                event: workingEvent,
                prevEvent: event,
                repeat: PLEventRepeatMode.One,
            },
        }));
    }

    onClickCancel() {
        this.onCancel();
    }

    getSelectedBillingCodeName() {
        return this.billingCodes.find((bc: any) => bc.code === this.selectedCode).name;
    }
}

const VALID_CODES = ['canceled_holiday', 'canceled_tech_issue', 'canceled_24_notice', 'unplanned_school_closure'];
