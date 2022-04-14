import {
    Component,
    Input,
} from '@angular/core';

@Component({
    selector: 'pl-organization-profile-header',
    templateUrl: './pl-organization-profile-header.component.html',
    styleUrls: ['./pl-organization-profile-header.component.less'],
})
export class PLOrganizationProfileHeaderComponent {
    @Input() organization: any = {};
}
