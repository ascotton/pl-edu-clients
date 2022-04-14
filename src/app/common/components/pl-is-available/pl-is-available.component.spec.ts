import {
    Component,
    Input,
} from '@angular/core';

import {
    ComponentFixture,
    TestBed,
} from '@angular/core/testing';

import { PLIsAvailableComponent } from './pl-is-available.component';

describe('PLIsAvailableComponent', () => {
    const componentContent = 'The data';

    @Component({
        selector: 'pl-host-component',
        template: `<pl-is-available [if]="condition">{{ content }}></pl-is-available>`,
    })
    class HostComponent {
        @Input() condition: any;
        @Input() content: string;
    }

    let component: HostComponent;
    let fixture: ComponentFixture<HostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [HostComponent, PLIsAvailableComponent],
        });

        fixture = TestBed.createComponent(HostComponent);
        component = fixture.componentInstance;
        component.content = componentContent;
    });

    it('creates', () => {
        expect(component).toBeTruthy();
    });

    it('shows template if condition is true', () => {
        component.condition = true;
        fixture.detectChanges();

        expect(fixture.debugElement.nativeElement.textContent).toContain(componentContent);
    });

    it('shows "not available" if condition is false', () => {
        component.condition = false;
        fixture.detectChanges();

        expect(fixture.debugElement.nativeElement.textContent).toContain('Not available');
    });

    it('does not show template if condition is false', () => {
        component.condition = false;
        fixture.detectChanges();

        expect(fixture.debugElement.nativeElement.textContent).not.toContain(componentContent);
    });

    describe('falsy conditions', () => {
        it('does not show template if condition is 0', () => {
            component.condition = 0;
            fixture.detectChanges();

            expect(fixture.debugElement.nativeElement.textContent).toContain('Not available');
        });

        it('does not show template if condition is an empty string', () => {
            component.condition = '';
            fixture.detectChanges();

            expect(fixture.debugElement.nativeElement.textContent).toContain('Not available');
        });

        it('does not show template if condition is null', () => {
            component.condition = null;
            fixture.detectChanges();

            expect(fixture.debugElement.nativeElement.textContent).toContain('Not available');
        });

        it('does not show template if condition is undefined', () => {
            component.condition = undefined;
            fixture.detectChanges();

            expect(fixture.debugElement.nativeElement.textContent).toContain('Not available');
        });
    });
});
