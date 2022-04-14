import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { PLUtilService, PLComponentStateInterface } from '@common/services';

@Component({
  selector: 'pl-student-status-help',
  templateUrl: './pl-student-status-help.component.html',
  styleUrls: ['./pl-student-status-help.component.less'],
})

export class PLStudentStatusHelpComponent implements OnInit, OnDestroy {
  @Input() onCancel: Function;

  public _state: PLComponentStateInterface;
  private classname = 'PLStudentStatusHelpComponent';

  constructor(
    public util: PLUtilService,
  ) { }

  ngOnInit() {
    this._state = this.util.initComponent({
      name: this.classname,
      fn: (state: PLComponentStateInterface, done) => {
        done();
      }
    });
  }

  ngOnDestroy() {
    this.util.destroyComponent(this._state);
  }

}
