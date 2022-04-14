import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { PLUrlsService } from '@root/index';
import { PLInvoiceDocumentationService } from './pl-ida.service';

@Component({
    selector: 'pl-invoice-documentation-list',
    templateUrl: './pl-ida-list.component.html',
    styleUrls: ['./pl-ida-list.component.less']
})

export class PLInvoiceDocumentationListComponent {
  private user: User;
  constructor(
    private route: ActivatedRoute,
    private store: Store<AppStore>,
    private plUrls: PLUrlsService,
    public BO: PLInvoiceDocumentationService) {
    this.init();
  }

  init() {
    this.store
      .select('currentUser')
      .pipe(
          first(user => !!user.uuid),
      )
      .subscribe(user => {
        this.user = user;
        this.BO.entryPoint(user, () => {
          this.route.queryParams.subscribe(params => {
            if (params) {
              this.BO.setPageParams(params);
            }
            if (params.debug) {
              this.BO.setDevDebug(params.debug);
            }
            if (params.flags) {
              this.BO.setDevDebug(params.flags);
            }
          });
        });
      });
  }

  onClickItem(item:any) {
    // Freeze list state changes while saving
    if (!this.BO.isGlobalReadyState()) {
      return;
    }
    if (item.itemKey === this.BO.getSelectedItem().itemKey) return;
    this.BO.setSelectedItem(item);
    this.BO.onSelectItem(true);
  }

  onClickSortNatural() {
    this.BO.sortByNaturalAppointmentOrder();
  }
  onClickSortName() {
    this.BO.sortByNameOrder();
  }
  onClickSortLocation() {
    this.BO.sortByLocationOrder();
  }
}
