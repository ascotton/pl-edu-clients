import {
    style,
    query,
    animate,
    trigger,
    transition,
    state,
} from '@angular/animations';

export const fadeAnimation = trigger('fade', [
    state('out', style({
        opacity: 0,
    })),
    state('in', style({
        opacity: 1,
    })),
    transition('* => *', [
        animate('0.5s'),
    ]),
]);
