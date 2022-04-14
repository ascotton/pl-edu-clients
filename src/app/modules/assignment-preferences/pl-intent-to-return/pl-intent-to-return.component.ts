import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { CurrentUserService } from '@modules/user/current-user.service';

import {
    PLGraphQLService,
} from '@root/index';
import { PLQualificationsService } from '@common/services';
import { PLQualification } from '@common/interfaces';

@Component({
    selector: 'pl-intent-to-return',
    templateUrl: './pl-intent-to-return.component.html',
    styleUrls: ['./pl-intent-to-return.component.less'],
    providers: [PLQualificationsService],
})
export class PLIntentToReturnComponent {
    returnOpts = [
        { value: 'y', label: 'Yes' },
        { value: 'n', label: 'No' },
        { value: 'u', label: 'Undecided' },
    ];
    yesNoOpts = [
        { value: 'y', label: 'Yes' },
        { value: 'n', label: 'No' },
    ];
    factorOpts = [
        { value: 'comp', label: 'Compensation' },
        { value: 'benefits', label: 'Benefits' },
        { value: 'schedule', label: 'Schedule conflicts' },
        { value: 'health', label: 'Personal/health considerations' },
        { value: 'assignment', label: 'Assignment/school satisfaction' },
        { value: 'delivery', label: 'Service delivery model satisfaction' },
    ];
    states: any = [];
    isIntentComplete = false;
    loading = true;

    intentToReturn: any;
    mostImportantFactor: any = 'comp'; /* as per clinical, removing for 2021 */
    exemptStates: any = [];
    comments: any;
    fulltimeRole: any;

    constructor(
        private plGraphQL: PLGraphQLService,
        private plCurrentUserService: CurrentUserService,
        private router: Router,
        private plProviderQualificationRequestService: PLQualificationsService,
    ) {
    }

    ngOnInit() {
        this.plCurrentUserService.getCurrentUser()
            .pipe(first())
            .subscribe((user: any) => {
                // check if user already completed the survey
                this.plGraphQL.query(GQL_GET_INTENT, {}, {})
                    .pipe(first())
                    .subscribe((res: any) => {
                        if (res.intentToReturn.length > 0) {
                            this.isIntentComplete = true;
                            this.loading = false;

                            return;
                        }

                        // get states provider is qualified in
                        const states = {};
                        this.plProviderQualificationRequestService
                            .getQualificationsRequests(user.uuid)
                            .pipe(first())
                            .subscribe((res2: any) => {
                                res2.results.forEach((q: PLQualification) => {
                                    q.qualification.states.forEach((s: any) => {
                                        states[s] = true;
                                    });
                                });

                                this.states = Object.keys(states).map((s: any) => ({ value: s, label: s }));

                                this.loading = false;
                            });
                    });
            });
    }

    canSave() {
        return this.intentToReturn && this.mostImportantFactor && this.fulltimeRole;
    }

    saveIntent() {
        this.loading = true;

        const data = {
            intent: this.intentToReturn,
            factor: this.mostImportantFactor,
            exemptStates: this.exemptStates.join(),
            comments: this.comments,
            fulltimeRole: this.fulltimeRole,
        };

        this.plGraphQL.mutate(GQL_MUTATE_INTENT, data)
            .pipe(first())
            .subscribe((res: any) => {
                this.isIntentComplete = true;
                this.loading = false;
            });
    }

    toDashboard() {
        this.router.navigate(['/landing']);
    }
}

const GQL_GET_INTENT = `
    query intentToReturn {
        intentToReturn {
            intent
        }
    }`;

const GQL_MUTATE_INTENT = `
    mutation createIntentToReturn($intent: String!, $factor: String!, $exemptStates: String, $comments: String, $fulltimeRole: String!) {
        createIntentToReturn(input: { intent: $intent, factor: $factor, exemptStates: $exemptStates, comments: $comments, fulltimeRole: $fulltimeRole }) {
            errors {
                code
            }
        }
    }`;
