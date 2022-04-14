import { PLISAService } from '../pl-isa.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Spectator, createComponentFactory } from '@ngneat/spectator';
import { PLISAGoToViewButtonComponent } from './pl-isa-go-to-view-button.component';

describe('PLISAGoToViewButtonComponent', () => {

    const mockedRouter = { provide: Router, useValue: {} };
    const mockedISASvc = { provide: PLISAService, useValue: {} };
    const mockedActivatedRoute = { provide: ActivatedRoute, useValue: {} };

    let spectator: Spectator<PLISAGoToViewButtonComponent>;

    const createComponent = createComponentFactory({
        component: PLISAGoToViewButtonComponent,
        providers: [mockedRouter, mockedISASvc, mockedActivatedRoute],
        detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('should succeed', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });
});