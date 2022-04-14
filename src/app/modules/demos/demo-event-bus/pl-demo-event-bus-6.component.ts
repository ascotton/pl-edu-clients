import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  PLUtilService, PLComponentStateInterface,
  PLEventMessageBus, PLEventStream, PLEventContext, PLEventMessage, PLMessageStream,
} from '@common/services';

@Component({
  selector: 'pl-demo-event-bus-6',
  templateUrl: './pl-demo-event-bus-6.component.html',
  styleUrls: ['./pl-demo-event-bus-6.component.less'],
})

export class PLDemoEventBus6 implements OnInit, OnDestroy {
  public _state: PLComponentStateInterface;
  private classname = 'PLDemoEventBus6';
  private demoGlobalBus: PLMessageStream;

  constructor(
    public util: PLUtilService,
    private messageBus: PLEventMessageBus,
  ) { }

  ngOnInit() {
    this._state = this.util.initComponent({
      name: this.classname,
      fn: (state, done) => {
        this._registerStreams(state);
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

  private _registerStreams(state: PLComponentStateInterface) {
    this.demoGlobalBus = this.messageBus.initStream(PLEventStream.IEP_GLOBAL_STREAM, state);
    this.demoGlobalBus.onReceive(PLEventContext.CTX_ALL, (message: PLEventMessage) => {
      state.bgColor = message.data.color;
    });
  }
}
