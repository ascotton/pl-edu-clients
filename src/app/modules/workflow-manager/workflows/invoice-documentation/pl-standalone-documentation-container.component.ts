import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { fadeInOnEnterAnimation } from 'angular-animations';

import { PLUtilService } from '@common/services';
import { AppStore } from '@app/appstore.model';
import { selectClientServices } from '@app/modules/schedule/store/clients';
import { selectBillingCodesCanProvide, selectNotesSchemeEntities } from '@common/store/billing';

import { PLInvoiceDocumentationService } from './pl-ida.service';

@Component({
    selector: 'pl-standalone-documentation-container',
    templateUrl: './pl-standalone-documentation-container.component.html',
    styleUrls: ['./pl-standalone-documentation-container.component.less'],
    animations: [
        fadeInOnEnterAnimation({ anchor: 'animateIn', duration: 1000 }),
    ],
})

export class PLStandaloneDocumentationContainerComponent implements OnInit, OnDestroy {
    constructor(
        private dialog: MatDialog,
        private store$: Store<AppStore>,
        public util: PLUtilService,
        public BO: PLInvoiceDocumentationService,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public modalInput: { appointment: any, preloaded: boolean, readOnly: boolean },
    ) { }

    isLoaded = false;
    isReadOnlyView = false;
    data: any = {};
    checkChangesTimeout: any;
    appointment: any;

    ngOnInit() {
        const { appointment, preloaded, readOnly } = this.modalInput;
        this.appointment = appointment;
        const user$ = this.store$.select('currentUser');
        if (!preloaded) {
            user$.subscribe(user =>
                this.BO.entryPoint(user,
                    () => this.BO.setStandaloneAppointment(appointment)));
        }
        combineLatest([
            this.store$.select(selectClientServices()),
            this.store$.select(selectNotesSchemeEntities),
            this.store$.select(selectBillingCodesCanProvide).pipe(filter(value => value.length > 0)),
            user$,
        ]).pipe(
            map(([clientServices, notesSchemas, billingCodes, currentUser]) => ({
                clientServices,
                notesSchemas,
                billingCodes,
                currentUser,
            })),
        ).subscribe((res) => {
            this.data = {
                clientServices: res.clientServices,
                notesSchemas: res.notesSchemas,
                billingCodes: res.billingCodes,
                user: res.currentUser,
                event: this.appointment,
            };

            setTimeout(() => {
                this.isLoaded = true;
                if (this.util.flagLocalStorage('DEV_IDA_READONLY')) {
                    this.isReadOnlyView = true;
                    return;
                }
                readOnly ?
                    this.isReadOnlyView = true :
                    this.setReadOnlyCase(res.currentUser);
            }, 100);
        });

        this.BO.setChangeDetectorRef(this.cdr);
    }

    ngOnDestroy() {

    }

    onClickClient(item: any) {
        this.BO.setSelectedItem(item);
        this.BO.onSelectItem(true);
    }

    onCloseDocumentation() {
        this.dialog.closeAll();
    }

    shouldShowClientList() {
        return this.BO.selectedAppointment
            && this.BO.isStandaloneAppointment()
            && this.BO.isClientAppointment(this.BO.selectedAppointment)
            && this.BO.appointmentsList.length > 1
            && !this.BO.selectedAppointment.state.editingDateTime;
    }

    /**
     * CAMs must see only a read-only view of the  modal displaying the documentation
     * Therefore this function.
     */
    setReadOnlyCase(currentUser: any): void {
        this.isReadOnlyView = currentUser.uuid !== this.BO.provider.uuid;
    }
}
