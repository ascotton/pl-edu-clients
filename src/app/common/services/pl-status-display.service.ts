import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { PLClientStudentDisplayService } from '@root/index';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

@Injectable()
export class PLStatusDisplayService {

    currentUser: User;

    constructor(private store: Store<AppStore>) {
        store.select('currentUser')
            .subscribe((user: any) => {
                this.currentUser = user;
                this.updateDictionary();
            });
    }

    dictionary: any = {
        DirectService_NOT_STARTED: {
            shape: 'yellow-dark-dot',
            label: 'Not Started',
            description: 'No events have been scheduled for this service.',
        },
        DirectService_IN_PROCESS: {
            shape: 'green-dot',
            label: 'In Therapy',
            description: 'One or more events have been documented for this service.',
        },
        DirectService_COMPLETED: {
            shape: 'blue-dot',
            label: 'Completed',
            description: 'This service has concluded for this student for the current school year.',
        },
        DirectService_CANCELLED: {
            shape: 'gray-dot',
            label: 'Discontinued',
            description: 'The student\'s parent or school has requested to end this service, or the student has transferred out of the school district.',
        },
        DirectService_IDLE: {
            shape: 'clock',
            label: 'Idle',
            description: 'This service was started, but no events have been documented for this service within the last three months.',
        },
        Evaluation_NOT_STARTED: {
            shape: 'yellow-dark-dot',
            label: 'Not Started',
            description: 'No events have been scheduled for this evaluation since it was matched to the Provider.',
        },
        Evaluation_IN_PROCESS: {
            shape: 'green-dot',
            label: 'In Process',
            description: 'One or more events have been documented for this evaluation in the past 90 days.',
        },
        Evaluation_COMPLETED: {
            shape: 'blue-dot',
            label: 'Completed',
            description: 'Assessment(s) and report(s) associated with this service have been delivered to the client and customer.',
        },
        Evaluation_CANCELLED: {
            shape: 'gray-dot',
            label: 'Cancelled',
            description: 'This evaluation will not be completed by PresenceLearning.',
        },
        Evaluation_IDLE: {
            shape: 'clock',
            label: 'Idle',
            description: 'This evaluation was started, but no events or documentation have been recorded in over 90 days.',
        },
        Evaluation_UNASSIGNED: {
            shape: 'gray-dot',
            label: 'Unassigned',
            description: 'PresenceLearning is finding the right match for this client\'s evaluation.',
        },
        Client_ONBOARDING: {
            label: 'Onboarding',
            shape: 'yellow-dark-dot',
            description: 'The status of a student with an active referral who does not have any documented therapy sessions associate with the referral.',
        },
        Client_IN_SERVICE: {
            label: 'In Service',
            shape: 'green-dot',
            description: 'Student has at least one service \'In Progress\' or \'In Therapy\'.',
        },
        Client_NOT_IN_SERVICE: {
            label: 'Not In Service',
            shape: 'gray-dot',
            description: 'All service(s) for student are completed, canceled or idle.',
        },
    };

    updateDictionary() {
        let text = PLClientStudentDisplayService.get(this.currentUser);
        let regEx = new RegExp('client', 'g');
        this.dictionary.Evaluation_COMPLETED.description =
         this.dictionary.Evaluation_COMPLETED.description.replace(regEx, text);
        this.dictionary.Evaluation_UNASSIGNED.description =
         this.dictionary.Evaluation_UNASSIGNED.description.replace(regEx, text);
    }

    getStatusKeys(status: string) {
        return Object.keys(this.dictionary);
    }

    getStatusDisplayObject(status: string) {
        return this.dictionary[status];
    }

    getLabelForStatus(status: string) {
        return this.dictionary[status].label;
    }

    getShapeForStatus(status: string) {
        return this.dictionary[status].shape;
    }

    getDescriptionForStatus(status: string) {
        return this.dictionary[status].description;
    }

}