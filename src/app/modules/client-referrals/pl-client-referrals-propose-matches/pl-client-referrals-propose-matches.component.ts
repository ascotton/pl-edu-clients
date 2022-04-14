import {
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { PLFormService } from '@root/index';
import { Option } from '@common/interfaces';

export interface ProposeMatchesEvent {
    organizationId: string;
}

@Component({
    selector: 'pl-client-referrals-propose-matches',
    templateUrl: './pl-client-referrals-propose-matches.component.html',
    styleUrls: ['./pl-client-referrals-propose-matches.component.less'],
})
export class PLClientReferralsProposeMatchesComponent {
    @Input() schoolYearLabel = '';
    @Input() organizationOptions: Option[] = [];

    @Output() readonly proposeMatches: EventEmitter<ProposeMatchesEvent> = new EventEmitter();
    @Output() readonly cancel: EventEmitter<any> = new EventEmitter();

    organizationId = '';

    readonly form: FormGroup = new FormGroup({});

    handleCancelClick(): void {
        this.cancel.emit();
    }

    handleProposeMatchesClick(): void {
        PLFormService.markAllAsTouched(this.form);

        if (this.form.valid) {
            const event = {
                organizationId: this.organizationId,
            };

            this.proposeMatches.emit(event);
        }
    }
}
