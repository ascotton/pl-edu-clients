import { Component, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
    selector: 'pl-nav-left-steps',
    templateUrl: './pl-nav-left-steps.component.html',
    styleUrls: ['./pl-nav-left-steps.component.less'],
})
export class PLNavLeftStepsComponent {
    @Input() steps: any[] = [];
    @Input() skipSteps: boolean = true;
    @Input() mayGoPrevious: boolean = true;

    constructor(
        private router: Router,
    ) {
    }

    ngOnInit() {
        this.formatSteps();
        // Need to update on each route change (step change) too.
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.formatSteps();
            }
        });
    }

    ngOnChanges() {
        this.formatSteps();
    }

    formatSteps() {
        // Figure out what step we are on.
        let currentStepIndex = -1;
        const url = window.location.href;
        for (let ii = 0; ii < this.steps.length; ii++) {
            if (url.includes(this.steps[ii].href)) {
                currentStepIndex = ii;
                break;
            }
        }
        this.steps = this.steps.map((_step, index) => {
            const step = { ..._step };
            step.mayClick = this.skipSteps;
            if ((step.status === 'complete' || index <= currentStepIndex) && this.mayGoPrevious) {
                step.mayClick = true;
            }
            if (index === currentStepIndex) {
                step.mayClick = true;
            }
            step.classes = {
                step: {
                    complete: step.status,
                    disabled: !step.mayClick,
                },
            };
            return step;
        });
    }
}
