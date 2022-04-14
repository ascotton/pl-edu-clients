import { Component, Input } from '@angular/core';
import { PLProviderProfileService } from '@common/services';
import { Option } from '@root/src/lib-components/common/interfaces';

@Component({
    selector: 'pl-provider-notification-preferences',
    templateUrl: './pl-provider-notification-preferences.component.html',
    styleUrls: ['./pl-provider-notification-preferences.component.less'],
})
export class PLProviderNotificationPreferencesComponent {
    @Input() userId: string;
    @Input() selectedNotificationPreferences: string[] = [];
    @Input() onSave: Function;

    notificationPreferencesOptions: Option[] = [];
    notificationPreferences: any[];

    constructor(
        private plProviderProfileService: PLProviderProfileService,
    ) {}

    ngOnInit() {
        this.notificationPreferencesOptions = this.plProviderProfileService.getNotificationPreferences();
        this.notificationPreferences = this.notificationPreferencesOptions.map((opt: Option) => {
            return {
                ...opt,
                disabled: opt.value === 'EMAIL',
                selected: this.selectedNotificationPreferences.includes(opt.value.toString()),
            };
        });
    }

    onClickSave() {
        const selectedNotifications = this.notificationPreferences.filter(n => n.selected).map(n => n.value);
        this.plProviderProfileService.setNotificationPreferences(this.userId, selectedNotifications)
            .subscribe(() => {
                this.onSave(selectedNotifications);
            });
    }
}
