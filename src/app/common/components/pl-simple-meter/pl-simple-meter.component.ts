import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { slideInLeftOnEnterAnimation } from 'angular-animations';
import {
  PLUtilService,
  PLComponentStateInterface,
} from '@common/services';

@Component({
    selector: 'pl-simple-meter',
    templateUrl: './pl-simple-meter.component.html',
    styleUrls: ['./pl-simple-meter.component.less'],
    animations: [slideInLeftOnEnterAnimation()],
})

export class PLSimpleMeterComponent implements OnInit, OnDestroy {
    public _state: PLComponentStateInterface;
    private classname = 'PLSimpleMeterComponent';

    @Input() width = '100';
    @Input() value: number;
    @Input() text: string;
    @Input() label: string;
    @Input() color = 'green';
    @Input() bgColor: string;
    @Input() shape = 'rounded';
    @Input() isFullWidth = false;
    @Input() animateProgress = false;

    constructor(
        public util: PLUtilService,
        private cdr: ChangeDetectorRef,
    ) { }

  // -------------------------
  // ----- PUBLIC METHODS
  // -------------------------
    getMeterStyles() {
        const style: any =  { width: (this.isFullWidth) ? '100%' : this._state.props.width + 'px' };
        if (this.bgColor) {
            style.backgroundColor = this.bgColor;
        }
        return style;
    }

    getProgressStyles() {
        return {
            width: this.getProgressWidth(),
            backgroundColor: this.color,
            borderColor: `1px solid ${this.color}`,
            transition: this.animateProgress ? 'width .5s ease-out' : 'none',
        };
    }

    // -------------------------
    // ----- PRIVATE METHODS
    // -------------------------
    private getProgressWidth() {
        return (this.isFullWidth) ?
            this.value + '%' :
            Math.floor((this.value / 100) * Number(this.width)) + 'px';
    }

    // -------------------------
    // ----- LIFECYCLE METHODS
    // -------------------------
    ngOnInit() {
        this._state = this.util.initComponent({
            name: this.classname,
            params: {
                flags: {
                    NO_DEBUG: 1,
                },
            },
            afterDoneFn: () => this.cdr.markForCheck(),
            fn: (state: PLComponentStateInterface, done) => {
                state.props = {
                    width: this.width,
                    value: this.value,
                    text: this.text,
                    label: this.label,
                    color: this.color,
                };
                done();
            },
        });
    }

    ngOnDestroy() {
        this.util.destroyComponent(this._state);
    }
}
