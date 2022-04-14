import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PLDestroyComponent } from '@root/src/app/common/components';
import { PLSchoolYearsService } from '@root/src/app/common/services';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { first, takeUntil } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { CanComponentDeactivate } from '@common/can-deactivate-guard.service';
import { PLAssessmentsTableService } from './pl-assessments-table.service';
import { PLEvaluationResponse } from './models';

@Component({
    selector: 'pl-clients-assessements',
    templateUrl: './pl-clients-assessments.component.html',
    styleUrls: ['./pl-clients-assessments.component.less'],
})
export class PLClientsAssessmentsComponent extends PLDestroyComponent implements CanComponentDeactivate, OnInit {
    @Input() customerLocation: any;
    @Input() customerOrganization: any;

    TOAST_TIMEOUT = 5000;
    selectedSchoolYear: string = null;
    assessmentsTableService: PLAssessmentsTableService;
    loadedCurrentUser = false;
    hasFiltersVisible = false;

    constructor(
        private yearsService: PLSchoolYearsService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private toastr: ToastrService,
        assessmentsTableService: PLAssessmentsTableService,
    ) {
        super();
        this.assessmentsTableService = assessmentsTableService;
    }

    ngOnInit(): void {
        this.assessmentsTableService.resetAssessments();
        this.assessmentsTableService.isEditingNotes = false;
        if (this.customerLocation) {
            this.assessmentsTableService.updateCustomerLocation(this.customerLocation.id);
        } else if (this.customerOrganization) {
            this.assessmentsTableService.updateCustomerOrganization(this.customerOrganization.id);
        }
        this.yearsService.getCurrentSchoolYearCode()
            .pipe(first(), takeUntil(this.destroyed$))
            .subscribe((year: any) => {
                this.selectedSchoolYear = year;
                this.assessmentsTableService.currentUserLoaded$
                    .pipe(takeUntil(this.destroyed$))
                    .subscribe((loaded: any) => {
                        if (loaded) {
                            this.loadedCurrentUser = true;
                        }
                    });
            });
    }

    canDeactivate(): true | Observable<boolean> {
        if (!this.assessmentsTableService.hasUnsavedNotes()) {
            return true;
        }
        return of(false);
    }

    loadData(filters?: any): void {
        let query = {
            schoolYearCode_In: this.selectedSchoolYear === 'all_time' ? null : this.selectedSchoolYear,
            productTypeCode_In: 'evaluation_with_assessments',
        };

        if (filters) {
            query = {
                ...query,
                ...filters,
            };
        }

        this.assessmentsTableService.loadAssessments(query);
    }

    saveAssessment(evaluation: PLEvaluationResponse, isService: boolean): void {
        this.assessmentsTableService.saveAssessment(evaluation, isService).subscribe(
            (resService: any) => {
                this.toastr.success('Successfully saved assessment', '🎉 SUCCESS', {
                    positionClass: 'toast-bottom-right',
                    timeOut: this.TOAST_TIMEOUT,
                });
            },
            (err: any) => {
                this.toastr.error(`Unable to save assessment`, '❌ FAILED', {
                    positionClass: 'toast-bottom-right',
                    timeOut: this.TOAST_TIMEOUT,
                });
            },
        );
    }

    onAssessmentChange(event: any): void {
        const { assessment, change } = event;
        const evaluation: PLEvaluationResponse = {
            id: assessment.isService ? assessment.id : assessment.referralId,
        };

        if (change.stage && change.stage !== '') {
            evaluation.evaluationStage = change.stage;
        }

        if (change.assessmentPlanSignedOn && change.assessmentPlanSignedOn !== '') {
            evaluation.assessmentPlanSignedOn = moment(change.assessmentPlanSignedOn, 'MM/DD/YYYY').format('YYYY-MM-DD');
        }

        if (change.meetingDate && change.meetingDate !== '') {
            evaluation.meetingDate = moment(change.meetingDate, 'MM/DD/YYYY').format('YYYY-MM-DD');
        }

        if (change.dueDate && change.dueDate !== '') {
            evaluation.dueDate = moment(assessment.dueDate, 'MM/DD/YYYY').format('YYYY-MM-DD');
        }

        if (assessment.isService) {
            this.saveAssessment(evaluation, true);
        } else {
            const referralRequestBody = this.assessmentsTableService.prepareReferralForSave(evaluation);
            this.saveAssessment(referralRequestBody, false);
        }
    }

    onYearSelected(event: any): void {
        this.selectedSchoolYear = event.model;
        this.loadData(this.assessmentsTableService.lastQuery);
    }

    onQuery(event: any): any {
        this.loadData(event);
    }

    routeTo(uriToRoute: string): void {
        let queryParams: any = {};
        if (this.customerLocation && this.customerLocation.id) {
            queryParams = {
                location: this.customerLocation.id,
            };

            if (this.customerLocation.organization && this.customerLocation.organization.id) {
                queryParams.org = this.customerLocation.organization.id;
            }
        }
        if (this.customerOrganization && this.customerOrganization.id) {
            queryParams = {
                org: this.customerOrganization.id
            };
        }
        this.router.navigate([uriToRoute], {
            relativeTo: this.activatedRoute,
            queryParams: {
                ...queryParams,
                next: this.router.url
            },
        });
    }

    onToggleFilters(): void {
        this.hasFiltersVisible = !this.hasFiltersVisible;
    }
}
