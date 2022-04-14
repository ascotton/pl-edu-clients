import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { PLUtilService, PLComponentStateInterface } from '@common/services';

@Component({
  selector: 'basic-test-api',
  templateUrl: './basic-test-api.component.html',
  styleUrls: ['./basic-test-api.component.less'],
})

export class BasicTestAPIComponent implements OnInit, OnDestroy {
  @Input() actionButtonLabel: string;
  // Method - API call action 
  @Input() onClickApiAction: Function;
  // Model - API data
  @Input() modelApiData: Function;

  public _state: PLComponentStateInterface;

  constructor(
    public util: PLUtilService,
  ) { }

  ngOnInit() {
    this._state = this.util.initComponent({
      name: BasicTestAPIComponent.name,
      fn: (state, done) => {
        state.showData = false;
        state.flags['NO_DEBUG'] = 1;
        done();
      }
    });
  }
  ngOnDestroy() {
    this.util.destroyComponent(this._state);
  }

  onClickClear() {
    this.modelApiData = null;
  }

  onClickToggleData() {
    this._state.showData = !this._state.showData;
  }
}
