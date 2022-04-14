import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PLHandbookModalComponent } from './pl-handbook-modal.component';
import { PLModalService, PLModalModule, PLIconModule } from '@root/index';

describe('PLHandbookModalComponent', () => {
    let component: PLHandbookModalComponent;
    let fixture: ComponentFixture<PLHandbookModalComponent>;

    const mockedModalService = {
        destroyAll: () => { },
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [PLIconModule, PLModalModule],
            providers: [{ provide: PLModalService, useValue: mockedModalService }],
            declarations: [PLHandbookModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PLHandbookModalComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shouldn\'t display timeout UI when headerText isn\'t Automatic Timeout', () => {
        component.headerText = '';
        fixture.detectChanges();
        expect(component.automaticTimeout).not.toBeTruthy();
    });

    it('should start interval and display timeout UI when headerText is Automatic Timeout', (done) => {
        component.timeoutTimer = 5;
        component.headerText = 'Automatic Timeout';
        component.onCancel = () => { };

        fixture.detectChanges();
        setTimeout(() => {
            expect(component.automaticTimeout).toBeTruthy(); // timeout UI displayed when true.
            expect(component.isIntervalRunning).toBeTruthy();
            expect(component.timeoutTimer).toBeLessThan(5);
            expect(component.timeoutTimer).toBeGreaterThan(0);
            done();
        }, 3000);
    });
});
