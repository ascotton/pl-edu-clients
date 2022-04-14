import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  PLUtilService, PLComponentStateInterface,
} from '@common/services';

@Component({
  selector: 'pl-demo-event-bus-3',
  templateUrl: './demo-event-bus-3.component.html',
  styleUrls: ['./demo-event-bus-3.component.less'],
})

export class PLDemoEventBus3 implements OnInit, OnDestroy {
  public _state: PLComponentStateInterface;
  private classname = 'PLDemoEventBus3';

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
