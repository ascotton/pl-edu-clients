import {
    Component,
    Input,
} from '@angular/core';

/*
    Replaces content of any element with "Not available" when [if] input is falsy.

    Note: if the [if] condition is meangingful as data in a falsy form (read:
    available) then the if condition must explicitly check the non-available
    condition.

    For example, a particular boolean value could be true, false, or
    null if it's not availble in the database. In this case, check if the value
    is null to determine if it's "not available":

    <pl-is-available [if]="booleanValue !== null">{{ booleanValue }}</pl-is-available>
*/
@Component({
    selector: 'pl-is-available',
    template: `
        <ng-content *ngIf="condition"></ng-content>
        <span *ngIf="!condition" class="not-available">Not available</span>
    `,
    styles: [`
        .not-available {
            font-style: italic;
        }
   `],
})
export class PLIsAvailableComponent {
    @Input() condition: any;
}
