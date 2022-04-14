import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { PLUtilService, PLComponentStateInterface } from '@common/services';
import { PLClientIEPGoalsService } from '../pl-client-iep-goals.service';

@Component({
  selector: 'pl-client-iep-metric-item',
  templateUrl: './pl-client-iep-metric-item.component.html',
  styleUrls: ['./pl-client-iep-metric-item.component.less'],
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ height: '100%', opacity: 0 }),
          animate('600ms', style({ height: '100%', opacity: 1 }))
        ]),
      ]
    )
  ],
})

export class PLClientIEPMetricItemComponent implements OnInit, OnDestroy {
  @Input() metric: any;
  @Input() metrics: any;
  @Input() deleteMetrics: any;

  public _state: PLComponentStateInterface;
  private classname = 'PLClientIEPMetricItemComponent';

  constructor(
    public util: PLUtilService,
    public service: PLClientIEPGoalsService,
  ) {
  }

  ngOnInit() {
    this._state = this.util.initComponent({
      name: this.classname,
      fn: (state, done) => {
        state.model.metric = this.metric;
        state.model.metrics = this.metrics;
        state.model.deleteMetrics = this.deleteMetrics;
        done();
      }
    });
  }

  ngOnDestroy() {
    this.util.destroyComponent(this._state);
  }

  // --------------------------
  // public methods
  // --------------------------
  onClickUnDelete() {
    delete this.metric.deleted;
  }

  onClickDelete() {
    if (this.metric.id) {
      this.metric.deleted = true;
    } else {
      this.metrics.splice(this.metrics.indexOf(this.metric), 1);
    }
  }

  getNameChars() {
    const name = this.metric.name;
    return name && name.length;
  }

  hasNameValue() {
    const name = this.metric.name;
    return name && name.length;
  }

  validateForm(clickSave?: boolean) {
    this.util.validateForm(this._state, (messages: any) => {
      const gp = new Number(this.metric.goalPercentage);
      if (gp < 1 || gp > 100) {
        messages[keys.GOAL_PERCENT] = 'Must be between 1 and 100';
        this.metric._invalid = true;
      } else {
        delete messages[keys.GOAL_PERCENT];
        delete this.metric._invalid;
      }
    });
  }

  getValidationMessageGoalPercent() {
    return this.util.getValidationMessage(keys.GOAL_PERCENT, this._state);
  }
}

const enum keys {
  GOAL_PERCENT = 'goalPercent',
}
