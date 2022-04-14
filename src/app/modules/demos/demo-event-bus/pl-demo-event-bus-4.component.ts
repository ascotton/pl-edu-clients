import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  PLUtilService, PLComponentStateInterface,
} from '@common/services';

@Component({
  selector: 'pl-demo-event-bus-4',
  templateUrl: './pl-demo-event-bus-4.component.html',
  styleUrls: ['./pl-demo-event-bus-4.component.less'],
})

export class PLDemoEventBus4 implements OnInit, OnDestroy {
  public _state: PLComponentStateInterface;
  private classname = 'PLDemoEventBus4';

  constructor(
    public util: PLUtilService,
  ) { }

  ngOnInit() {
    this._state = this.util.initComponent({
      name: this.classname,
      fn: (state, done) => {
        done();
      }
    });
  }

  ngOnDestroy() {
    this.util.destroyComponent(this._state);
  }

  getColor() {
    return this._state.bgColor || 'white';
  }
}
