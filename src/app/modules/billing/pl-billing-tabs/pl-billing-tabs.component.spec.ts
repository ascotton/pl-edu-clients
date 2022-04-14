import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { MockModule } from 'ng-mocks';
import { Router } from '@angular/router';
import { PLTabsModule } from '@root/index';
import { PLBillingTabsComponent } from './pl-billing-tabs.component';
import { createComponentFactory, Spectator } from '@ngneat/spectator';

describe('PLBillingTabsComponent', () => {

    const storeStub = {
        select: () => {
            return new Observable((observer: any) => {
                observer.next(false);
            });
        },
    };
    const routerStub = {
        routerState: {
            snapshot: {
                url: '',
            },
        },
    };
    const mockedStore = { provide: Store, useValue: storeStub };
    const mockedRouter = { provide: Router, useValue: routerStub };

    let spectator: Spectator<PLBillingTabsComponent>;
    const createComponent = createComponentFactory({
        component: PLBillingTabsComponent,
        imports: [ MockModule(PLTabsModule) ],
        providers: [mockedStore, mockedRouter],
    });

    beforeEach(() => spectator = createComponent());

    it('should succeed', () => {
        expect(spectator).toBeDefined();
        expect(spectator).toBeTruthy();
    });

    describe('WHEN IT\'S NOT A W2 TYPE OF PROVIDER:', () => {
        beforeEach(() => spectator.component.isW2Provider = false);

        it('the valid route should remain false.', () => {
            expect(spectator.component.isValidRoute).toBeFalsy();
        });

        it('tabs to display should remain empty.', () => {
            expect(spectator.component.tabs).toHaveLength(0);
        });
    });

    describe('WHEN IT\'S A W2 TYPE OF PROVIDER', () => {
        beforeEach(() => spectator.component.isW2Provider = true);

        it('the valid route should be true.', () => {
            spectator.component.ngAfterContentChecked();
            expect(spectator.component.isValidRoute).toBeTruthy();
        });

        it('tabs to display should be two.', () => {
            spectator.component.ngAfterContentChecked();
            expect(spectator.component.tabs).toHaveLength(2);
        });
    });
});
