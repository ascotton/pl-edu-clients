import { Component, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

import {PLHttpService, PLToastService} from '@root/index';

@Component({
    selector: 'pl-client-metric-save',
    templateUrl: './pl-client-metric-save.component.html',
    styleUrls: ['./pl-client-metric-save.component.less'],
    inputs: ['service', 'metric'],
})
export class PLClientMetricSaveComponent {
    @Output() onSave = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<any>();
    @Output() onDelete = new EventEmitter<any>();

    service: any = {};
    metric: any = {};

    metricSaveForm: FormGroup = new FormGroup({});
    savingMetric: boolean = false;

    constructor(private plHttp: PLHttpService, private plToast: PLToastService) {
    }

    ngOnInit() {
    }

    ngOnChanges(changes: any) {
    }

    save(form: any) {
        this.savingMetric = true;
        const params = Object.assign({}, this.metric, {
            client_service: this.service.id,
        });
        this.plHttp.save('metrics', params)
            .subscribe((res: any) => {
                this.plToast.show('success', 'Metric saved.', 2000, true);
                this.savingMetric = false;
                form.reset();
                this.onSave.emit();
            }, (err: any) => {
                this.savingMetric = false;
            });
    }

    cancel(form: any) {
        this.onCancel.emit();
    }

    delete(form: any) {
        this.savingMetric = true;
        const params = {
            uuid: this.metric.uuid,
        };
        this.plHttp.delete('metrics', params)
            .subscribe((res: any) => {
                this.plToast.show('success', 'Metric removed.', 2000, true);
                this.savingMetric = false;
                form.reset();
                this.onDelete.emit();
            }, (err: any) => {
                this.savingMetric = false;
            });
    }
};
