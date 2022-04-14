import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PLTimeGridBlockComponent } from './pl-time-grid-block.component';
import { PLTimeGridService } from '../../services';

describe('PLHandbookTextEditorComponent', () => {
    let component: PLTimeGridBlockComponent;
    let fixture: ComponentFixture<PLTimeGridBlockComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [PLTimeGridService],
            declarations: [PLTimeGridBlockComponent],
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PLTimeGridBlockComponent);
        component = fixture.componentInstance;
        // fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
