import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { PLOrganizationsService } from '../pl-organizations.service';

@Component({
    selector: 'pl-organization-assessments',
    templateUrl: './pl-organization-assessments.component.html',
})
export class PLOrganizationAssessmentsComponent implements OnInit {
    organization: any = {};
    loading = false;

    constructor(
        private plOrganizationsService: PLOrganizationsService,
    ) { }

    ngOnInit(): void {
        this.loading = true;
        this.plOrganizationsService.currentOrgDetails()
            .pipe(first())
            .subscribe((org: any) => {
                this.organization = org;
                this.loading = false;
            });
    }
}
