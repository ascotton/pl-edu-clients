import { animate, style, transition, trigger } from '@angular/animations';
import {
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { serviceEvalStageOptions } from '@common/services/pl-client-service';
import { PLTableFrameworkService, PLTableFrameworkUrlService, PLTableLocalDataService } from '@root/index';
import { PLDestroyComponent } from '@root/src/app/common/components';
import { PLNote } from '@root/src/app/common/components/pl-notes-list/pl-notes-list.component';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, first, takeUntil, withLatestFrom } from 'rxjs/operators';
import { PLAssessmentRow } from '../models';
import { PLAssessmentCaseManagerModalComponent } from '../pl-assessment-case-manager-modal/pl-assessment-case-manager-modal.component';
import { PLAssessmentsTableService } from '../pl-assessments-table.service';

@Component({
    selector: 'pl-assessments-table',
    templateUrl: './pl-assessments-table.component.html',
    styleUrls: ['./pl-assessments-table.component.less'],
    providers: [PLTableLocalDataService],
    animations: [
        trigger('inOutAnimation', [
            transition(':enter', [
                style({ height: '0px', opacity: 0 }),
                animate('150ms', style({ height: '*', opacity: 1 })),
            ]),
            transition(':leave', [
                style({ height: '*', opacity: 1 }),
                animate('150ms', style({ height: '0px', opacity: 0 })),
            ]),
        ]),
    ],
})
export class PLAssessmentsTableComponent extends PLDestroyComponent implements OnInit, OnDestroy {
    @Input() hasFiltersVisible: boolean;

    @Output() assessmentChange = new EventEmitter<any>();
    @Output() tableChange = new EventEmitter<any>();
    @Output() closeFilters = new EventEmitter<boolean>();

    TOAST_TIMEOUT = 5000;
    dateColumns: any = {
        assessmentPlanSignedOn: {
            minDate: new Date((new Date()).getFullYear() - 1, 0, 1),
            maxDate: new Date((new Date()).getFullYear() + 1, 11, 31),
        },
        dueDate: {
            minDate: new Date((new Date()).getFullYear() - 1, 0, 1),
            maxDate: new Date((new Date()).getFullYear() + 1, 11, 31),
        },
        meetingDate: {
            minDate: new Date((new Date()).getFullYear() - 1, 0, 1),
            maxDate: new Date((new Date()).getFullYear() + 1, 11, 31),
        },
    };
    queryChanges$ = new BehaviorSubject<any>({});
    filtersStateFromUrl$: BehaviorSubject<any>;
    assessmentStageOpts = serviceEvalStageOptions;
    defaultOrdering = 'dueDate';
    currentOrdering = this.defaultOrdering;
    assessments: PLAssessmentRow[] = [];
    loadingAssessments = true;
    localTableService: PLTableLocalDataService;
    assessmentsTableService: PLAssessmentsTableService;
    totalAssessments = 0;
    isFirstQueryChange = true;
    useFixedPageSize = true;

    constructor(
        private dialog: MatDialog,
        private toastr: ToastrService,
        private activatedRoute: ActivatedRoute,
        private plTableFrameworkUrl: PLTableFrameworkUrlService,
        private plTableFramework: PLTableFrameworkService,
        assessmentsTableService: PLAssessmentsTableService,
        localTableService: PLTableLocalDataService,
    ) {
        super();
        this.localTableService = localTableService;
        this.assessmentsTableService = assessmentsTableService;
    }

    ngOnInit(): void {
        this.setFiltersStateFromUrl();
        this.listenToTableChanges();
        this.listenToQueryChanges();
    }

    ngOnDestroy(): void {
        this.assessmentsTableService.clearAllFilters();
    }

    setFiltersStateFromUrl(): void {
        this.plTableFrameworkUrl.getStateFromUrl(this.assessmentsTableService.TABLE_STATE_NAME)
            .pipe(takeUntil(this.destroyed$), first())
            .subscribe((res: any) => {
                this.filtersStateFromUrl$ = new BehaviorSubject(res.query);
            });
        this.filtersStateFromUrl$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((urlParams: any) => {
                this.assessmentsTableService.setFiltersValuesFromUrl(urlParams);
                const accountCamFilter = this.assessmentsTableService.filters.accountCam;
                this.assessmentsTableService.setLimitOrgFilterByCAMAccount(accountCamFilter.textArray.length > 0);
            });
    }

    updateQueryParamsState(query: any): void {
        const queryParams = this.plTableFramework.getQueryParams(query);
        this.plTableFrameworkUrl.updateUrl(this.assessmentsTableService.TABLE_STATE_NAME, queryParams);
        this.filtersStateFromUrl$.next(query);
    }

    listenToTableChanges(): void {
        this.loadingAssessments = this.assessmentsTableService.loadingAssessments;
        this.assessmentsTableService.assessments$
            .pipe(takeUntil(this.destroyed$))
            .subscribe(assessments => {
                this.assessments = assessments;
                this.localTableService.dataRows = assessments;
                this.localTableService.pageSize = assessments.length;
                this.localTableService.updateDisplayRows();
                this.totalAssessments = this.assessmentsTableService.totalAssessments;
                this.loadingAssessments = this.assessmentsTableService.loadingAssessments;
                this.expandOnQueryParam();
            });
    }

    listenToQueryChanges(): void {
        const filtersChanges = this.assessmentsTableService.formFilterChangesText();
        this.queryChanges$.next({
            ...filtersChanges,
            ...this.assessmentsTableService.defaultFilters,
            ...this.assessmentsTableService.tableQuery,
            orderBy: '',
            orderByDueDate: 'asc'
        });
        this.queryChanges$.pipe(
            takeUntil(this.destroyed$),
            distinctUntilChanged((prev, curr) => this.shallowEqual(prev, curr)),
            withLatestFrom(this.filtersStateFromUrl$),
            debounceTime(500)
        ).subscribe(([changes, urlState]) => {
            if (changes) {
                if (this.isFirstQueryChange) {
                    const defaultFilters = this.getDefaultFilters(urlState);
                    changes = {
                        ...defaultFilters,
                        ...this.assessmentsTableService.tableQuery,
                        ...urlState,
                        orderBy: '',
                        orderByDueDate: 'asc'
                    };
                    this.isFirstQueryChange = false;
                }
                const preparedQuery = this.assessmentsTableService.prepareQuery(changes);
                this.updateQueryParamsState(preparedQuery);
                this.assessmentsTableService.lastQuery = preparedQuery;
                this.tableChange.emit(preparedQuery);
            }
        });
    }

    getDefaultFilters(urlState: any): any {
        const defaultFilters = {...this.assessmentsTableService.defaultFilters};
        if (!urlState.accountCam && Object.keys(urlState).length) {
            defaultFilters.accountCam = '';
        }
        return defaultFilters;
    }

    onQuery(event: any): void {
        let filtersChanges = this.assessmentsTableService.formFilterChangesText();
        filtersChanges.orderBy = this.setOrderByQuery(event.orderQuery);
        if (event.query) {
            this.assessmentsTableService.tableQuery = {
                first: `${event.query.limit}`,
                offset: `${event.query.offset}`,
            };
        }
        filtersChanges = this.setOrderingByDueDate(event, filtersChanges);
        filtersChanges = {...filtersChanges, ...this.assessmentsTableService.tableQuery };
        this.queryChanges$.next(filtersChanges);
    }

    setOrderingByDueDate(event: any, filters: any): any {
        const filtersChanges = {...filters};
        let orderQuery = event.orderQuery;
        if (!orderQuery) {
            orderQuery = this.currentOrdering;
        }
        const isAscending = orderQuery.indexOf('-') === -1;
        const orderKey = isAscending ? orderQuery : orderQuery.substring(1);
        if (orderKey === 'dueDate') {
            filtersChanges.orderByDueDate = isAscending ? 'asc' : 'desc';
            filtersChanges.orderBy = '';
        }
        return filtersChanges;
    }

    setOrderByQuery(orderQuery: string): string {
        if (!orderQuery) {
            orderQuery = this.currentOrdering;
        } else {
            this.currentOrdering = orderQuery;
        }

        const isAscending = orderQuery.indexOf('-') === -1;
        const orderKey = isAscending ? orderQuery : orderQuery.substring(1);
        const tableOrderings = this.assessmentsTableService.assessmentsTableOrderings[orderKey];
        let keyOrderings = tableOrderings ? tableOrderings : [];
        keyOrderings = isAscending ? keyOrderings : keyOrderings.map(o => `-${o}`);
        return keyOrderings.join(',');
    }

    getDateFormControlValue(value: string): string {
        return new FormControl(new Date(value)).value;
    }

    openAddCaseManagerDialog(row: any, isNew: boolean = false): void {
        const dialogRef = this.dialog
            .open(PLAssessmentCaseManagerModalComponent, {
                data: {
                    client: row.client,
                    contact: !isNew ? row.caseManager : null,
                    contactTypes: this.assessmentsTableService.contactTypes,
                    languages: this.assessmentsTableService.contactLanguages
                },
                maxHeight: '100vh',
                maxWidth: '630px',
                width: '630px',
                panelClass: 'case-manager-modal',
                disableClose: false,
            });
        this.updateContactsOnSaveOrDelete(dialogRef);
        this.closeDialogsOnEscape(dialogRef);
    }

    onStageChange(event: any, assessment: PLAssessmentRow): void {
        assessment.stage = event.value;
        this.assessmentChange.emit({ assessment, change: { stage: event.value } });
    }

    onSignedOnChange(event: any, assessment: PLAssessmentRow): void {
        assessment.assessmentPlanSignedOn = event.targetElement.value;
        this.assessmentChange.emit({ assessment, change: { assessmentPlanSignedOn: event.targetElement.value } });
    }

    onDueDateChange(event: any, assessment: PLAssessmentRow): void {
        assessment.dueDate = event.targetElement.value;
        this.assessmentChange.emit({ assessment, change: { dueDate: event.targetElement.value } });
    }

    onMeetingDateChange(event: any, assessment: PLAssessmentRow): void {
        assessment.meetingDate = event.targetElement.value;
        this.assessmentChange.emit({ assessment, change: { meetingDate: event.targetElement.value } });
    }

    onToggleNotes(assessment: PLAssessmentRow): void {
        if (!this.assessmentsTableService.hasUnsavedNotes()) {
            assessment.isNotesOpen = !assessment.isNotesOpen;
        }

        if (!assessment.isNotesOpen) {
            assessment.hasClickedAddNote = false;
        }
    }

    onAddNotesClick(assessment: PLAssessmentRow): void {
        assessment.hasClickedAddNote = true;
        this.onToggleNotes(assessment);
    }

    onAnimationDone(assessment: PLAssessmentRow, event: any): void {
        assessment.isAnimationComplete = assessment.isNotesOpen;
    }

    shouldDisplayColumn(col: string): boolean {
        const visibleColumns = this.assessmentsTableService.tableColumnsToggle.value;
        const allVisibleColumns = this.assessmentsTableService.alwaysVisibleColumns.concat(visibleColumns);
        return allVisibleColumns.includes(col) && this.assessmentsTableService.userColumns.includes(col);
    }

    handleNoteCreated(assessment: PLAssessmentRow): void {
        assessment.hasNotes = true;
    }

    handleNoteEditing(isNoteEditing: boolean): void {
        this.assessmentsTableService.isEditingNotes = isNoteEditing;
    }

    handleNotesUpdated(notesList: PLNote[], assessment: PLAssessmentRow): void {
        assessment.hasNotes = notesList.length > 0;
    }

    canUpdateAssessment(assessment: any): boolean {
        const hasPermissions = assessment.isService ?
            (assessment.permissions.updateEvaluation || assessment.permissions.modifyEvaluationDates) :
            assessment.permissions.updateReferral;
        return hasPermissions;
    }

    canAddContacts(assessment: PLAssessmentRow): boolean {
        return this.assessmentsTableService.userCanAddOrEditClientContact(assessment.client);
    }

    canUpdateStage(assessment: PLAssessmentRow): boolean {
        return assessment.isService && !this.isCompletedOrCancelled(assessment);
    }

    isCompletedOrCancelled(assessment: PLAssessmentRow): boolean {
        return ['COMPLETED', 'CANCELLED'].includes(assessment.status);
    }

    expandOnQueryParam(): void {
        const rowId = this.activatedRoute.snapshot.queryParamMap.get('assessment_id');
        this.localTableService.dataRows.forEach(row => {
            if (rowId === row.id) {
                this.onToggleNotes(row);
                this.scrollIntoView(row);
            }
        });
    }

    scrollIntoView(row: PLAssessmentRow): void {
        setTimeout(() => {
            const rowElem = document.querySelector(`[data-rowid='${row.id}']`);
            if (rowElem) {
                rowElem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }
        }, 0);
    }

    onToggleFilters(): void {
        this.closeFilters.emit(true);
    }

    private closeDialogsOnEscape(dialogRef: MatDialogRef<any>): void {
        dialogRef.keydownEvents()
            .pipe(takeUntil(this.destroyed$))
            .subscribe(({ key }) => {
                if (key === 'Escape') {
                    dialogRef.close();
                }
            });
    }

    private updateContactsOnSaveOrDelete(dialogRef: MatDialogRef<any>): void {
        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroyed$))
            .subscribe(caseManagerUpdates => {
                if (caseManagerUpdates) {
                    this.assessmentsTableService.updateAssessmentsClientContacts(caseManagerUpdates);
                    this.toastr.success(`Successfully ${caseManagerUpdates.save ? 'saved' : 'deleted'} contact`, '🎉 SUCCESS', {
                        positionClass: 'toast-bottom-right',
                        timeOut: this.TOAST_TIMEOUT,
                    });
                }
            });
    }

    private shallowEqual(object1, object2): boolean {
        const keys1 = Object.keys(object1);
        const keys2 = Object.keys(object2);
        if (keys1.length !== keys2.length) {
            return false;
        }
        for (let key of keys1) {
            if (object1[key] !== object2[key]) {
                return false;
            }
        }
        return true;
    }
}

