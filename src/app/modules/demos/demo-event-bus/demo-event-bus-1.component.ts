import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  PLUtilService, PLComponentStateInterface,
  PLEventMessageBus, PLEventStream, PLEventContext, PLEventMessage, PLMessageStream,
} from '@common/services';

@Component({
  selector: 'pl-demo-event-bus-1',
  templateUrl: './demo-event-bus-1.component.html',
  styleUrls: ['./demo-event-bus-1.component.less'],
})

export class PLDemoEventBus1 implements OnInit, OnDestroy {
  public _state: PLComponentStateInterface;
  private classname = 'PLDemoEventBus1';

  private demoClientBus: PLMessageStream;
  private demoGlobalBus: PLMessageStream;

  constructor(
    public util: PLUtilService,
    public messageBus: PLEventMessageBus,
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
    this.demoClientBus = this.messageBus.initStream(PLEventStream.demoClientStream, state);
    this.demoGlobalBus = this.messageBus.initStream(PLEventStream.demoGlobalStream, state);
    this.demoClientBus.onReceive(PLEventContext.CTX_DEMO_CLIENT, (message: PLEventMessage) => {
      state.bgColor = message.data.color;
    });
    this.demoGlobalBus.onReceive(PLEventContext.CTX_ALL, (message: PLEventMessage) => {
      state.bgColor = message.data.color;
    });
    this.demoGlobalBus.onReceive('HOT_LAVA', (message: PLEventMessage) => {
      state.bgColor = message.data.color;
    });
  }
}
