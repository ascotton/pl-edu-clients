/**
 * A common event bus to broker messages across contexts.
 * Send and receive messages on different message streams.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { PLUtilService, PLComponentStateInterface } from './pl-util.service';

/**
 * PLEventMessageBus enables message passing across components.
 *
 * Summary:
 *   - Messages can be used to send and receive data.
 *   - Messages contain Context and Data
 *      - Context indicates the type of message
 *      - Data is the state/information object being passed along
 *   - Messages are sent and received against Named Observable Streams
 *      - Named Observable Streams are of type BehaviorSubject
 *
 * Example:
 *
 *   Send a message from a source component:
 *
 *     // select a stream
 *     const iepGlobalBus = this.eventBus.initStream(stream, state);
 *     // send a message (data and context) to the stream
 *     iepGlobalBus.send({data, context});
 *
 *   Receive a message in a target component:
 *
 *     //  select a stream
 *     const iepGlobalBus = this.eventBus.initStream(stream, state);
 *     // receive messages for a particular context
 *     iepGlobalBus.onReceive(context, (message) => {})
 */
@Injectable()
export class PLEventMessageBus {
  public ID = new String(Math.random()).substring(2, 6);

  constructor(
    public util: PLUtilService,
  ) {}

  // send a message to all receivers
  // if there are multiple instances of a component receiving a type of message
  // the message can contain arbitrary data to help decide whether to apply it
  private _send(stream: string, message: PLEventMessage, state?: PLComponentStateInterface) {
    this[`${stream}$`] && this[`${stream}$`].next(message);
    this.util.traceLog(`sent message
   STREAM: ${stream}
  CONTEXT: ${message.context}`, message.data || '', state);
  }

  private _receive(stream: string, context: string, state: PLComponentStateInterface, fn: Function) {
    let subscription;
    this[`${stream}$`] && state.subscriptions.push(subscription=this[`${stream}$`].subscribe((message: PLEventMessage) => {
      if (context === message.context) {
        this.util.traceLog(`received data
   STREAM: ${stream}
  CONTEXT: ${context}`, message.data, state);
        fn(message);
      }
    }));
    return subscription;
  }

  // select specific components based on a select function
  // this can be useful when targeting a specific instance in a list
  // or a single instance of a common component
  private _selectAndReceive(stream: string, context: string, state: PLComponentStateInterface, filterFn: PLMessageBusSelectFunction, fn: Function) {
    let subscription;
    this[`${stream}$`] && state.subscriptions.push(subscription = this[`${stream}$`].subscribe((message: PLEventMessage) => {
      if (context === message.context && filterFn(message)) {
        this.util.traceLog(`received data
   STREAM: ${stream}
  CONTEXT: ${context}`, message.data, state);
        fn(message);
      }
    }));
    return subscription;
  }

  public initStream(stream: string, state: PLComponentStateInterface): PLMessageStream {
    return {
      send: (message: PLEventMessage) => {
        this._send(stream, message, state);
      },
      onReceive: (context: string, fn?: Function) => {
        return this._receive(stream, context, state, fn);
      },
      onSelectAndReceive: (context: string, filterFn: PLMessageBusSelectFunction, fn?: Function) => {
        return this._selectAndReceive(stream, context, state, filterFn, fn);
      }
    }
  }

  // Message Streams
  private iepGlobalStream$ = new BehaviorSubject<any>({});
  private appGlobalStream$ = new BehaviorSubject<any>({});

  private demoGlobalStream$ = new BehaviorSubject<any>({});
  private demoProviderStream$ = new BehaviorSubject<any>({});
  private demoClientStream$ = new BehaviorSubject<any>({});
}

type PLMessageBusSenderFunction = (message: PLEventMessage) => void;
type PLMessageBusReceiverFunction = (context: string, fn?: Function) => void;
type PLMessageBusReceiverSelectFunction = (context: string, selectFn: Function, fn?: Function) => void;

type PLMessageBusSelectFunction = (message: PLEventMessage) => boolean;

export type PLMessageStream = {
  send: PLMessageBusSenderFunction,
  onReceive: PLMessageBusReceiverFunction,
  onSelectAndReceive: PLMessageBusReceiverSelectFunction,
};

export interface PLEventMessage {
  context: string,
  data?: any,
  fn?: Function,
}

export enum PLEventStream {
  APP_GLOBAL_STREAM = 'appGlobalStream',
  IEP_GLOBAL_STREAM = 'iepGlobalStream',
  demoClientStream = 'demoClientStream',
  demoProviderStream = 'demoProviderStream',
  demoGlobalStream = 'demoGlobalStream',
}

export enum PLEventContext {
  APP_DEBUG_BAR = 'APP_DEBUG_BAR',
  CTX_DEMO_CLIENT = 'CTX_DEMO_CLIENT',
  CTX_DEMO_PROVIDER = 'CTX_DEMO_PROVIDER',
  CTX_ALL = 'CTX_ALL',
}
