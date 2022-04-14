import { MockComponent } from 'ng-mocks';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator';
import { PLDrawMode } from '../../interfaces';

import { MatTooltipModule } from '@angular/material/tooltip';

import { PLTimeGridService } from '../../services';
import { PLTimeGridColumnComponent } from './pl-time-grid-column.component';
import { PLTimeGridBlockComponent } from '../pl-time-grid-block/pl-time-grid-block.component';

describe('PLTimeGridColumnComponent', () => {

    const LA_TZ = 'America/Los_Angeles';
    const NY_TZ = 'America/New_York';

    let spectator: Spectator<PLTimeGridColumnComponent>;

    const createComponent = createComponentFactory({
        component: PLTimeGridColumnComponent,
        imports: [
            MatTooltipModule,
        ],
        providers: [
            PLTimeGridService,
        ],
        declarations: [
            MockComponent(PLTimeGridBlockComponent),
        ],
    });

    const initializeTimeGrid = (groups = 1, start = '07:00:00', end = '16:00:00', timezone = LA_TZ) => {
        const timeGrid = spectator.inject(PLTimeGridService);
        const locTime = timeGrid.timeObj({ start, end }, timezone);
        timeGrid.buildTimeGrid(locTime);
        timeGrid.numberOfGroups = groups;
        return timeGrid;
    };

    beforeEach(() => spectator = createComponent({ props: { timezone: LA_TZ } }));

    it('should create', () => {
        expect(spectator.component).toBeTruthy();
        expect(spectator.component.timezone).toBe(LA_TZ);
        // expect(spectator.query('.clickable')).toBeTruthy('clickable');
    });

    xit('should Start Selection', async() => {
        const timeGrid = initializeTimeGrid(3);
        const expectedTime = timeGrid.timeObj({ start: '08:00:00', end: '08:15:00' }, LA_TZ);
        spectator.component.drawMode = PLDrawMode.Any;
        expect(spectator.component.selecting).toBeFalsy();
        expect(spectator.component.tempBlock).toBeUndefined();
        spectator.dispatchMouseEvent('.drawing-box', 'mousedown', 10, 200);
        await spectator.fixture.whenStable();
        expect(spectator.component.selecting).toBeTruthy();
        const  { time, group, week } = spectator.component.selection;
        expect(group).toBe(0);
        expect(week).toBeNull();
        expect(time.start.isSame(expectedTime.start)).toBeTruthy(`Start time does not match ${time.start.format('HH:mm')}`);
        expect(time.end.isSame(expectedTime.end)).toBeTruthy(`End time does not match ${time.end.format('HH:mm')}`);
        expect(spectator.component.tempBlock).toBeTruthy();
    });

    xit('should NOT Start Selection', async() => {
        initializeTimeGrid(3);
        spectator.component.drawMode = PLDrawMode.None;
        expect(spectator.component.selecting).toBeFalsy();
        spectator.dispatchMouseEvent('.drawing-box', 'mousedown', 10, 170);
        await spectator.fixture.whenStable();
        expect(spectator.component.selecting).toBeFalsy('selecting');
    });

    xit('should updateSelection', () => {
    });

    xit('should endSelection', () => {
    });
});
