import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PlCalendarFooterComponent } from './pl-calendar-footer.component';

describe('PlCalenadrFooterComponent', () => {
  let component: PlCalendarFooterComponent;
  let fixture: ComponentFixture<PlCalendarFooterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PlCalendarFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlCalendarFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
