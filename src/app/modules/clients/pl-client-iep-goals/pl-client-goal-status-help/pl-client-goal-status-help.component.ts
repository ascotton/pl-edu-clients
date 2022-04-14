import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { PLUtilService, PLComponentStateInterface } from '@common/services';

@Component({
  selector: 'pl-client-goal-status-help',
  templateUrl: './pl-client-goal-status-help.component.html',
  styleUrls: ['./pl-client-goal-status-help.component.less'],
})

export class PLClientGoalStatusHelpComponent implements OnInit, OnDestroy {
  @Input() onCancel: Function;
  statuses: any[] = [
    {
      goal: {status: 'ACHIEVED'},
      description: 'Student met the criteria outlined in the goal.'
    },
    {
      goal: { status: 'PARTIALLY_ACHIEVED' },
      description: 'Student made progress toward the goal from baseline functioning but did not meet all the criteria outlined in the goal by the end of the of the service period.'
    },
    {
      goal: { status: 'DISCONTINUED' },
      description: 'Intervention targeting this goal initated but stopped during the service period.'
    },
    {
      goal: { status: 'NOT_ADDRESSED' },
      description: 'This goal was never targeted during intervention over the course of the service period.'
    },
  ];

  public _state: PLComponentStateInterface;
  private classname = 'PLClientGoalStatusHelpComponent';

  constructor(
    public util: PLUtilService,
  ) { }

  ngOnInit() {
    this._state = this.util.initComponent({
      name: this.classname,
      fn: (state: PLComponentStateInterface) => {
      }
    });
  }

  ngOnDestroy() {
    this.util.destroyComponent(this._state);
  }

}
