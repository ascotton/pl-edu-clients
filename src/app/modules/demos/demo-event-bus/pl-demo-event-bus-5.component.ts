import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  PLUtilService, PLComponentStateInterface,
  PLEventMessageBus, PLEventStream, PLEventMessage,
  PLEventContext, PLMessageStream,
} from '@common/services';

@Component({
  selector: 'pl-demo-event-bus-5',
  templateUrl: './pl-demo-event-bus-5.component.html',
  styleUrls: ['./pl-demo-event-bus-5.component.less'],
})

export class PLDemoEventBus5 implements OnInit, OnDestroy {
  public _state: PLComponentStateInterface;
  private classname = 'PLDemoEventBus5';

  private iepGLobalBus: PLMessageStream;

  constructor(
    public util: PLUtilService,
    private messageBus: PLEventMessageBus,
  ) {}

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

  onClickSendMessage(data: any, context?: string) {
    this.iepGLobalBus.send({context, data});
  }

  private _registerStreams(state: PLComponentStateInterface) {
    this.iepGLobalBus = this.messageBus.initStream(PLEventStream.demoGlobalStream, state);
    this.iepGLobalBus.onReceive(PLEventContext.CTX_ALL, (message: PLEventMessage) => {
      this._state.bgColor = message.data.color;
    });
  }
}
