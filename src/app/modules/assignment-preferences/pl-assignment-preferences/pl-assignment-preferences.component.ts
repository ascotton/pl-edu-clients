import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';

import { User } from '@modules/user/user.model';

import {
    PLGraphQLService,
    PLHttpService,
} from '@root/index';

const organizationsQuery = require('../queries/organizations.graphql');

@Component({
    selector: 'pl-assignment-preferences',
    templateUrl: './pl-assignment-preferences.component.html',
    styleUrls: ['./pl-assignment-preferences.component.less'],
})
export class PLAssignmentPreferencesComponent {
    assignments: any[] = [];
    selectOptsPreference = [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'neutral', label: 'Neutral' },
    ];
    loading = true;

    constructor(
        private plGraphQL: PLGraphQLService,
        private plHttp: PLHttpService,
        private store: Store<any>,
        private router: Router,
    ) {
    }

    ngOnInit() {
        this.store.select('currentUser')
            .subscribe((user: any) => {
            });
        this.getAssignments();
    }

    getAssignments() {
        const params = {
            is_reviewable: true,
        };
        this.plHttp.get('assignmentPreferences', params)
            .subscribe((assignments: any) => {
                if (assignments.length > 0) {
                    this.assignments = this.formatAssignments(assignments);
                    this.loading = false;
                } else {
                    // this.router.navigate(['/landing']);
                    this.loading = false;
                }
            });
    }

    formatAssignments(assignments: any[] = []) {
        assignments.forEach((assignment: any) => {
            assignment.xOrgName = assignment.account_name;
            assignment.xFormVals = {
                preference: '',
                comments: '',
            };
            assignment.xFormInvalid = false;
            // Trigger initial check.
            this.checkFormValid({}, assignment);
        });
        return assignments;
    }

    saveAssignment(assignment: any, assignmentIndex: number) {
        this.checkFormValid({}, assignment);
        if (!assignment.xFormInvalid) {
            const data: any = {
                assignment: assignment.uuid,
                preference: assignment.xFormVals.preference,
                comments: assignment.xFormVals.comments,
            };
            this.plHttp.save('assignmentPreferences', data)
                .subscribe((res: any) => {
                    this.assignments.splice(assignmentIndex, 1);
                    // if (this.assignments.length === 0) {
                    //     this.router.navigate(['/landing']);
                    // }
                });
        }
    }

    checkFormValid(evt: any, assignment: any) {
        if (assignment.xFormVals.preference.length > 0) {
            assignment.xFormInvalid = false;

        } else {
            assignment.xFormInvalid = true;
        }
    }

    toDashboard() {
        this.router.navigate(['/landing']);
    }
}
