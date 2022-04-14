import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  PLUtilService, PLComponentStateInterface,
  PLEventMessageBus, PLEventStream, PLEventContext, PLEventMessage, PLMessageStream,
} from '@common/services';

@Component({
  selector: 'pl-demo-event-bus-2',
  templateUrl: './demo-event-bus-2.component.html',
  styleUrls: ['./demo-event-bus-2.component.less'],
})

export class PLDemoEventBus2 implements OnInit, OnDestroy {
  public _state: PLComponentStateInterface;
  private classname = 'PLDemoEventBus2';
  private demoProviderBus: PLMessageStream;
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
    this.demoProviderBus = this.messageBus.initStream(PLEventStream.demoProviderStream, state);
    this.demoGlobalBus = this.messageBus.initStream(PLEventStream.demoGlobalStream, state);
    this.demoProviderBus.onReceive(PLEventContext.CTX_DEMO_PROVIDER, (message: PLEventMessage) => {
      state.bgColor = message.data.color;
    });
    this.demoGlobalBus.onReceive(PLEventContext.CTX_ALL, (message: PLEventMessage) => {
      state.bgColor = message.data.color;
    });
  }
}
