import { Component, OnInit, Input, ViewChild, ElementRef, EventEmitter, Output, SimpleChanges } from '@angular/core';
import {
    PLUrlsService,
    PLHttpService,
    PLTimezoneService,
    PLModalService,
    PLConfirmDialogService,
} from '@root/index';
import { PLHandbookModalComponent } from '../pl-handbook-modal/pl-handbook-modal.component';

import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
import { AppStore } from '@app/appstore.model';

import { HANDBOOK_ROUTING_STORE, UserEditor, TinyConfig } from '../handbook.model';
import { environment } from '@environments/environment';

@Component({
    selector: 'pl-handbook-text-editor',
    templateUrl: './pl-handbook-text-editor.component.html',
    styleUrls: ['./pl-handbook-text-editor.component.less'],
})
export class PLHandbookTextEditorComponent implements OnInit {
    @Input() contentToLoad: any;
    @Input() tinyConfiguration: TinyConfig;
    @Input() timeoutTime: number;
    @Input() intervalTime: number;
    @Output() readonly isEditorBeingEdited = new EventEmitter();
    @ViewChild('plHandbookTextEditor') private textEditorElementRef: ElementRef;

    contentInfo = {
        checkoutBy: '',
        modifiedBy: '',
        modifiedOn: '',
        section: {
            id: '',
            name: '',
            description: '',
            textEditorContent: '',
            number: '',
        },
    };
    orgName = '';
    isEditing = false;
    isLoading = true;
    isCheckedOut = false;
    isModifiedAlready: boolean; // Helps to know whether the 'Last edited...' text has to be displayed or not
    isEditorDisabled = false;

    TINY_MCE_KEY = environment.TINY_MCE_KEY;

    currentUser: UserEditor = {
        firstName: null,
        lastName: null,
        timezone: null,
        dataOnCheckOut: null, // Stores a copy in case of cancelling the editing of any handbook.
    };
    private handbookRoutingAction$: any;
    private routingStoreConst = HANDBOOK_ROUTING_STORE;
    private textEditorInterval: any;
    private textEditorTimeout: any;

    private ERR = 'error';
    private GENERIC_ERR_MSG = 'There was an error, please try again.';
    private URL = {
        CHECKOUT: '/checkout/',
        COMPLETE: '/completecheckout/',
    };

    constructor(
        private store: Store<AppStore>,
        private plUrlsSvc: PLUrlsService,
        private plHttpSvc: PLHttpService,
        private plTimezoneSvc: PLTimezoneService,
        private plConfirmSvc: PLConfirmDialogService,
        private plModalSvc: PLModalService,
        private toastrSvc: ToastrService,
    ) { }

    ngOnChanges(changes: SimpleChanges) {
        this.stopTextEditorTimeout();
        this.stopTextEditorInterval();

        if (this.isEditing && changes.contentToLoad.currentValue.uuid) {
            this.displayModal(this.contentInfo.section.name);
        } else {
            this.startLoadingContent();
        }
    }

    ngOnInit() {
        this.store.select('currentUser').subscribe((user) => {
            this.currentUser.firstName = user.first_name;
            this.currentUser.lastName = user.last_name;
            this.currentUser.timezone = this.plTimezoneSvc.getUserZone(user);
        });

        this.handbookRoutingAction$ = this.store.select<any>(this.routingStoreConst.FUNCTION_NAME)
            .subscribe((action: any) => {
                if (action && action === this.routingStoreConst.STOP) {
                    this.displayModal(this.contentInfo.section.name);
                }
            });
    }

    ngOnDestroy() {
        this.handbookRoutingAction$.unsubscribe();

        // For security stop any timer that could've been left running.
        if (!this.isEditing) {
            this.stopTextEditorInterval();
            this.stopTextEditorTimeout();
        }
    }

    /**
     * In the meantime the user is reading the content another user might've checked out the same section.
     * Therefore a new checking of availability in regards to the section is performed before actually editing.
     */
    checkEditAvailability() {
        this.setLoading(true);
        const params = {
            school_year: this.contentToLoad.school_year,
            section_type: this.contentToLoad.section_type.uuid,
        };
        const url = `${this.plUrlsSvc.urls.handbookSection}${this.contentToLoad.handbookInfo.orgId}`;

        this.plHttpSvc.get('', params, url).subscribe((response: any) => {
            if (this.isaValidUser(response.checkout_by)) {
                this.edit();
            } else {
                this.disableEditButton(response.checkout_by);
                this.setLoading(false);
            }
        });
    }

    /**
     * Saves the text entered in the text-editor.
     * Param helps for a specific scenario:
     *   For when user navigates to a new section while still editing.
     *   User gets a modal asking whether to save or not.
     * @param loadNewContentAfterSaving
     */
    save(loadNewContentAfterSaving: boolean = false) {
        this.setLoading(true);
        this.stopTextEditorTimeout();
        this.stopTextEditorInterval();

        const success = (response: any) => {
            const modifiedOn = response.modified;
            const currentTime = this.plTimezoneSvc.toUserZone(modifiedOn, null, this.currentUser.timezone).format('MM/DD/YY');
            const message = `${this.contentInfo.section.number}. ${this.contentInfo.section.name} edited by ${this.currentUser.firstName} ${this.currentUser.lastName} on ${currentTime}`;

            this.updateUserAndDateOfModification(response.modified_by, modifiedOn);
            this.setEditing(false);
            this.stopTextEditorTimeout();
            this.toastMessage('success', message, 'Saved');

            if (loadNewContentAfterSaving) {
                this.startLoadingContent();
                this.continueRoutingStore();
            } else {
                this.setLoading(false);
                this.displayLastEditedByText(response.created, modifiedOn);
                this.enablePrintInDisabledEditor();
            }
        };
        const error = () => {
            this.toastMessage(this.ERR, this.GENERIC_ERR_MSG, 'Error in Saving');

            if (loadNewContentAfterSaving) {
                this.setEditing(false);
                this.startLoadingContent();
            } else {
                this.setLoading(false);
                this.startTextEditorTimeout();
                this.startTextEditorInterval();
                this.enablePrintInDisabledEditor();
            }
        };

        this.completeCheckOut(this.contentInfo.section.textEditorContent, success, error);
    }

    cancel() {
        this.setEditorDisabled(true);
        this.stopTextEditorTimeout();
        this.stopTextEditorInterval();

        this.plConfirmSvc.show({
            header: `Cancel ${this.contentInfo.section.name} Editing`,
            content: `<p class="margin-nl-t">
                        Are you sure you want to cancel this editing?
                    </p>`,
            primaryLabel: 'Yes', secondaryLabel: 'No',
            primaryCallback: () => {
                this.terminateByCheckOut();
            },
            secondaryCallback: () => {
                this.onReturnFromModal();
            },
            closeCallback: () => {
                this.onReturnFromModal();
            },
        });
    }

    stopTextEditorTimeout() {
        if (this.textEditorTimeout) {
            clearTimeout(this.textEditorTimeout);

            if (this.isEditing && !this.isEditorDisabled) {
                this.startTextEditorTimeout();
            }
        }
    }

    //#region Private Functions\

    /**
     * Used in scenario when user's in Edit mode and navigates away.
     * Works together with Org Handbook and Location Handbook
     */
    private continueRoutingStore() {
        this.store.dispatch(this.routingStoreConst.CONTINUE_ROUTE);
    }

    private checkOut(success: Function, error: Function) {
        const handbookInfo = this.contentToLoad.handbookInfo;
        const params = {
            section_type: this.contentInfo.section.id,
            school_year: handbookInfo.schoolYearId,
        };
        const url = `${this.plUrlsSvc.urls.handbookSection}${handbookInfo.orgId}${this.URL.CHECKOUT}`;

        this.plHttpSvc.save('', params, url).subscribe(success, error);
    }

    /**
     * @param cancelCheckout Only needed when user cancels the Edit.
     */
    private completeCheckOut(receivedData: any, success: Function, error: Function, cancelCheckout: string = 'false') {
        const handbookInfo = this.contentToLoad.handbookInfo;
        const params = {
            section_type: this.contentInfo.section.id,
            school_year: handbookInfo.schoolYearId,
            data: receivedData,
            cancel_checkout: cancelCheckout,
        };
        const url = `${this.plUrlsSvc.urls.handbookSection}${handbookInfo.orgId}${this.URL.COMPLETE}`;

        this.plHttpSvc.save('', params, url).subscribe(success, error);
    }

    private disableEditButton(checkOutBy: any) {
        let disable = false;

        if (checkOutBy) {
            disable = !this.isaValidUser(checkOutBy);

            if (disable) {
                this.contentInfo.checkoutBy = `${checkOutBy.first_name} ${checkOutBy.last_name}`;
            }
        }

        this.isCheckedOut = disable;
    }

    private displayModal(headerText: string) {
        const timeoutTimer = 60;

        const params: any = {
            timeoutTimer,
            headerText,
            onReturn: () => {
                this.onReturnFromModal();
            },
            onCancel: (loadNewContentAfterCancel: boolean = false) => {
                this.terminateByCheckOut(loadNewContentAfterCancel);
            },
            onSave: () => {
                const loadNewContentAfterSaving = true;
                this.save(loadNewContentAfterSaving);
            },
            onClose: () => {
                this.toastMessage('info', 'Editing session closed due to inactivity.', 'Checked Out');
            },
        };

        this.plModalSvc.create(PLHandbookModalComponent, params).subscribe(() => {
            this.setEditorDisabled(true);
            this.stopTextEditorTimeout();
            this.stopTextEditorInterval();
        });
    }

    private displayLastEditedByText(creationDate: string, modificationDate: string): void {
        const createdOn = this.plTimezoneSvc.toUserZone(creationDate, null, this.currentUser.timezone).format('YYY-MM-DD HH:mm:ss');
        const modifiedOn = this.plTimezoneSvc.toUserZone(modificationDate, null, this.currentUser.timezone).format('YYY-MM-DD HH:mm:ss');
        const modified = (createdOn !== modifiedOn);

        this.isModifiedAlready = modified;
    }

    /**
     * If checkoutBy is null or names matches; user is valid.
     */
    private isaValidUser(checkOutBy: any) {
        let validUser = true;

        if (checkOutBy) {
            const firstNameMatches = (checkOutBy.first_name === this.currentUser.firstName);
            const lastNameMatches = (checkOutBy.last_name === this.currentUser.lastName);

            validUser = (firstNameMatches && lastNameMatches);
        }

        return validUser;
    }

    private onReturnFromModal() {
        this.setEditorDisabled(false);
        this.startTextEditorTimeout();
        this.startTextEditorInterval();
    }

    private readContentToLoad() {
        if (this.contentToLoad) {
            const contentReceived = this.contentToLoad;

            this.orgName = contentReceived.handbookInfo.orgName;
            this.contentInfo.section.id = contentReceived.section_type.uuid;
            this.contentInfo.section.name = contentReceived.section_type.name;
            this.contentInfo.section.textEditorContent = contentReceived.data;
            this.contentInfo.section.description = contentReceived.section_type.description;
            this.contentInfo.section.number = contentReceived.section_type.number;

            this.displayLastEditedByText(contentReceived.created, contentReceived.modified);
            this.disableEditButton(contentReceived.checkout_by);
            this.updateUserAndDateOfModification(contentReceived.modified_by, contentReceived.modified);
        }
    }

    private edit() {
        const success = (response: any) => {
            this.setLoading(false);
            this.setEditing(true);
            this.setEditorDisabled(false);
            this.startTextEditorInterval();
            this.startTextEditorTimeout();
            this.currentUser.dataOnCheckOut = response.data; // Backup text editor data from API
        };
        const error = () => {
            this.setLoading(false);
            this.setEditing(false);
            this.stopTextEditorInterval();
            this.stopTextEditorTimeout();
            this.toastMessage(this.ERR, this.GENERIC_ERR_MSG, 'Error in Edit');
        };

        this.checkOut(success, error);
    }

    private enablePrintInDisabledEditor() {
        setTimeout(() => {
            const printButton = this.textEditorElementRef.nativeElement.getElementsByClassName('tox-tbtn--disabled');

            if (printButton.length > 0) {
                printButton[0].className = 'tox-toolbar-overlord';
                if (printButton[0].ariaDisabled) {
                    printButton[0].ariaDisabled = 'false'; // Chrome
                } else {
                    const nodeMapsNames = printButton[0].attributes; // firefox
                    const ariaAttribute = document.createAttribute('aria-disabled');

                    ariaAttribute.value = 'false';
                    nodeMapsNames.setNamedItem(ariaAttribute);
                }
                printButton[0].className = 'tox-tbtn';
            }
        }, 1000);
    }

    private startLoadingContent() {
        this.setLoading(true);

        if (this.contentToLoad) {
            if (this.contentToLoad.name) {
                this.contentInfo.section.name = this.contentToLoad.name;
                this.contentInfo.section.description = this.contentToLoad.description;
            } else {
                this.readContentToLoad();
                setTimeout(() => {
                    this.setLoading(false);
                    this.enablePrintInDisabledEditor();
                }, 300);
            }
        }
    }

    private setEditing(flag: boolean) {
        this.isEditing = flag;
        this.isEditorBeingEdited.emit(flag);
    }

    private setEditorDisabled(disabled: boolean) {
        this.isEditorDisabled = disabled;
    }

    private setLoading(flag: boolean) {
        this.isLoading = flag;
    }

    private startTextEditorInterval() {
        const success = (response: any) => { // On every checkout validate the same user is valid.
            try {
                if (!this.isaValidUser(response.checkout_by)) {
                    this.terminateByCheckOut();
                }
            } catch (error) {
                this.terminateByCheckOut();
            }
        };
        const error = (err: any) => {
            console.error(err);
        };

        this.textEditorInterval = setInterval(() => {
            this.checkOut(success, error);
        }, this.intervalTime);
    }

    private stopTextEditorInterval() {
        if (this.textEditorInterval) {
            clearInterval(this.textEditorInterval);
        }
    }

    private startTextEditorTimeout() {
        this.textEditorTimeout = setTimeout(() => {
            this.displayModal('Automatic Timeout');
        }, this.timeoutTime);
    }

    /**
     * Param helps for a specific scenario:
     *   For when user navigates to a new section while still editing.
     *   User gets a modal asking whether to cancel or not.
     * @param loadNewContent
     */
    private terminateByCheckOut(loadNewContent: boolean = false) {
        if (this.isEditing) {
            this.setLoading(true);
            this.stopTextEditorTimeout();
            this.stopTextEditorInterval();

            const success = (response: any) => {
                this.contentInfo.section.textEditorContent = this.currentUser.dataOnCheckOut;

                this.setLoading(false);
                this.setEditing(false);
                this.setEditorDisabled(false);
                this.stopTextEditorTimeout();

                if (loadNewContent) {
                    this.startLoadingContent();
                    this.continueRoutingStore();
                } else {
                    this.displayLastEditedByText(response.created, response.modified);
                    this.enablePrintInDisabledEditor();
                }
            };
            const error = () => {
                this.contentInfo.section.textEditorContent = this.currentUser.dataOnCheckOut;

                this.setLoading(false);
                this.setEditing(false);
                this.setEditorDisabled(false);
                this.stopTextEditorTimeout();
                this.toastMessage(this.ERR, this.GENERIC_ERR_MSG, 'Error in Cancel');
                this.enablePrintInDisabledEditor();
            };

            this.completeCheckOut('', success, error, 'true');
        }
    }

    /**
     * @param messageType 'success', 'error' or 'info'
     */
    private toastMessage(messageType: string, message: string, messageTitle: string) {
        this.toastrSvc[messageType](message, messageTitle, {
            positionClass: 'toast-bottom-right',
        });
    }

    private updateUserAndDateOfModification(user: { first_name: string, last_name: string }, date: string) {
        this.contentInfo.modifiedOn = this.plTimezoneSvc.toUserZone(date, null, this.currentUser.timezone).format('MM/DD/YY');

        if (user) {
            this.contentInfo.modifiedBy = `${user.first_name} ${user.last_name}`;
        }
    }

    //#endregion Private Functions

}