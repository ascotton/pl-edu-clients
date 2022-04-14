import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { PLUtilService, PLComponentStateInterface } from '@common/services';

@Component({
  selector: 'stream-test-api',
  templateUrl: './stream-test-api.component.html',
  styleUrls: ['./basic-test-api.component.less'],
})

export class StreamTestAPIComponent implements OnInit, OnDestroy {
  @Input() actionButtonLabel: string;
  // Method - API call action 
  @Input() onClickApiAction: Function;
  // Model - API data
  @Input() modelApiData: any;
  // Model - API stream
  @Input() modelApiStream: any;

  public _state: PLComponentStateInterface;

  constructor(
    public util: PLUtilService,
  ) { }

  ngOnInit() {
    this._state = this.util.initComponent({
      name: StreamTestAPIComponent.name,
      fn: (state, done) => {
        state.showData = true;
        state.flags['NO_DEBUG'] = 1;
        done();
      }
    });
  }
  ngOnDestroy() {
  }

  onClickClear() {
    this.modelApiData = null;
  }

  onClickToggleData() {
    this._state.showData = !this._state.showData;
  }
}
