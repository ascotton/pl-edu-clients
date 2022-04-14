import { Component, OnInit, OnDestroy, ComponentFactoryResolver } from '@angular/core';
import {
  PLUtilService, PLComponentStateInterface,
  PLEventMessageBus, PLEventStream, PLEventContext, PLMessageStream,
} from '@common/services';

@Component({
  selector: 'pl-demo-event-bus-0',
  templateUrl: './demo-event-bus-0.component.html',
  styleUrls: ['./demo-event-bus-0.component.less'],
})

export class PLDemoEventBus0 implements OnInit, OnDestroy {
  public _state: PLComponentStateInterface;
  private classname = 'PLDemoEventBus0';

  private demoClientBus: PLMessageStream;
  private demoProviderBus: PLMessageStream;
  private demoGlobalBus: PLMessageStream;

  constructor(
    public util: PLUtilService,
    public messageBus: PLEventMessageBus,
    private resolver: ComponentFactoryResolver,
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

  onClickSendMessage(data: any, context?: any) {
    if (context) {
      if (context === PLEventContext.CTX_DEMO_CLIENT) {
        this.demoClientBus.send({context, data});
      }
      if (context === PLEventContext.CTX_DEMO_PROVIDER) {
        this.demoProviderBus.send({context, data});
      }
    } else {
      this.demoGlobalBus.send({context: PLEventContext.CTX_ALL, data});
    }
  }

  private _registerStreams(state: PLComponentStateInterface) {
    this.demoClientBus = this.messageBus.initStream(PLEventStream.demoClientStream, state);
    this.demoProviderBus = this.messageBus.initStream(PLEventStream.demoProviderStream, state);
    this.demoGlobalBus = this.messageBus.initStream(PLEventStream.demoGlobalStream, state);
  }
}
