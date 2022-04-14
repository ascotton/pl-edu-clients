import { animate, style, transition, trigger } from '@angular/animations';

export const PLFadeInOutAnimation = trigger(
    'plFadeInOutAnimation', [
        transition(':enter', [
            style({ height: '0px', opacity: 0 }),
            animate('400ms', style({ height: '*', opacity: 1 })),
        ]),
        transition(':leave', [
            style({ height: '*', opacity: 1 }),
            animate('400ms', style({ height: '0px', opacity: 0 })),
        ]),
    ],
);
