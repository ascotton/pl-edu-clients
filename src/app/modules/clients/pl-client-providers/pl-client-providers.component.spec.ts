import { SimpleChange, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PLClientProvidersComponent } from './pl-client-providers.component';
// import { PLUrlsService } from './pl-table-framework.service';

class PLUrlsServiceStub {
};

/**
describe('PLClientProvidersComponent', () => {
    let comp: PLClientProvidersComponent;
    let fixture: ComponentFixture<PLClientProvidersComponent>;
    let plUrlsStub = new PLUrlsServiceStub();

    beforeEach( async(() => {
        TestBed.configureTestingModule({
            declarations: [ PLClientProvidersComponent ],
            providers: [
                { provide: PLUrlsService, useValue: plUrlsServiceStub }
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        })
        .compileComponents().then(() => {
            fixture = TestBed.createComponent(PLClientProvidersComponent);
            comp = fixture.componentInstance;
        })
    }));

    // it('ngOnChanges - should initialize the table header cell with changes', () => {
    //     comp.orderKey = 'ordering';
    //     const change = {prop: new SimpleChange([], 'ordering', true)};
    //     comp.ngOnChanges(change);
    //     expect(comp.orderable).toEqual(true);
    // });
});
*/
