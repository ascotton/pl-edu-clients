import { Component, OnDestroy, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';

import { PLOrganizationsService } from '../pl-organizations.service';
import { PLSchoolYearsService } from '@common/services/';

@Component({
    selector: 'pl-organization-documents',
    templateUrl: './pl-organization-documents.component.html',
    styleUrls: ['./pl-organization-documents.component.less'],
})
export class PLOrganizationDocumentsComponent implements OnDestroy, OnInit {

    mayUpload = true;
    mayDelete = true;

    orgIdSubscription: any;
    organizationId: string;

    selectedSchoolYear: any = null;
    selectedSchoolYearId: any;

    constructor(
        private schoolYearService: PLSchoolYearsService,
        private plOrganizationsService: PLOrganizationsService,
    ) { }

    ngOnInit() {
        this.orgIdSubscription = this.plOrganizationsService.currentOrgId().subscribe((orgId: string) => {
            this.organizationId = orgId;
        });

        this.schoolYearService.getYearsData().pipe(first()).subscribe(() => {
            this.schoolYearService.getCurrentSchoolYear().pipe(first()).subscribe((year: any) => {
                this.selectedSchoolYearId = year.id;
            });
        });
    }

    ngOnDestroy(): void {
        this.orgIdSubscription.unsubscribe();
    }

    onYearSelected(evt: any): void {
        this.selectedSchoolYear = evt.model;
        const selectedSchoolYearFull = this.schoolYearService.getYearForCode(this.selectedSchoolYear);
        if (selectedSchoolYearFull) {
            this.selectedSchoolYearId = selectedSchoolYearFull.id;
        }
    }
}
