# IEP Goals project

## Components

* PLClientIEPGoalsTabComponent
* PLClientIEPItemComponent
* PLClientIEPServiceAreaComponent
* PLClientIEPGoalItemComponent
* PLClientIEPMetricItemComponent

## Component hierarchy

![Component Hierarchy](https://github.com/presencelearning/edu-clients/blob/dev/src/app/modules/clients/pl-client-iep-goals/component-hierarchy.png)

## Code organization

The IEP code relies on some concepts that bind things together

* Flow context - Defines state contexts with logical [flow.start ... Flow.end] boundaries
* Behavior context - A behavior context is associated with a Flow context
* Responsibility context - A responsibility context reacts to changes within a behavior context
* Event stream - An event stream is a cross-component message channel to communicate changes
* Event message - An event message is information/data passed through a message channel
* Event Bus - The event bus is a utility that controls how messages are sent and received

## Contexts of behavior

Contexts of behavior are areas of the application that are the source of state/data changes, usually associated with some application flow.

Within a context, changes can be broadcast to the outside world by sending messages to stream channels through the event bus so that other components can react as needed.

Think of a context of behavior as data/event source that emits changes.


## Contexts of responsibility

Contexts of responsibility have a purpose that needs to be fulfilled on various events. For example, the PLIEPGoalsTabComponent is a container component that maintains a list of IEPs as top level state. This list needs to be maintained/refreshed when a new goal is added to an IEP.

Contexts of responsibility can also be contexts of behavior, but their responsibility capacity they often need to react to changes occurring elsewhere in an application flow.

These contexts react to changes from elsewhere by listening for messages sent on streams through the event bus.

Think of a context of responsibility as a receiver of data/events when behavior contexts send messages.


## Application flow

TBD


## Example contexts, flows, event bus usage 

PLIEPContext:

* ADD_GOAL, EDIT_GOAL, DELETE_GOAL
* ADD_METRIC, EDIT_METRIC, DELETE_METRIC

PLIEPFlow:

* END_ADD_GOAL, END_EDIT_GOAL
* END_ADD_METRIC, END_EDIT_METRIC
