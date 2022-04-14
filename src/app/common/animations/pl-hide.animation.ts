import { animate, style, transition, trigger, state } from '@angular/animations';

export const PLHideAnimation = trigger('hide', [
    state('true', style({
        width: 0,
        height: 0,
        opacity: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
    })),
    state('false', style({
        opacity: 1,
    })),
    transition('* => *', [
        animate('0.5s'),
    ]),
]);
