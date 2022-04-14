import { animate, style, transition, trigger } from '@angular/animations';

export const PLFadeInAnimation = trigger(
    'plFadeInAnimation', [
        transition(':enter', [
            style({ height: '100%', opacity: 0 }),
            animate('700ms', style({ height: '100%', opacity: 1 })),
        ]),
    ],
);
