import { Component, Input } from '@angular/core';
import { PLProviderProfileService } from '@common/services';

@Component({
    selector: 'pl-provider-languages',
    templateUrl: './pl-provider-languages.component.html',
    styleUrls: ['./pl-provider-languages.component.less'],
})
export class PLProviderLanguagesComponent {
    @Input() userId: string;
    @Input() selectedLanguages: any[] = [];
    @Input() onSave: Function;

    languageOptions: any[] = [];
    selectedLanguageCodes: any[] = [];

    constructor(
        private plProviderProfileService: PLProviderProfileService,
    ) {}

    ngOnInit() {
        this.plProviderProfileService.getProviderLanguages().subscribe((res: any) => {
            this.languageOptions = res;
        });
        this.selectedLanguageCodes = this.selectedLanguages.map((obj: any) => obj.code);
    }

    onClickSave() {
        this.plProviderProfileService.setProviderLanguages(this.userId, this.selectedLanguageCodes).subscribe(() => {
            const selected = this.languageOptions
                .map((obj: any) => ({ name: obj.label, code: obj.value }))
                .filter((obj: any) => this.selectedLanguageCodes.includes(obj.code));
            this.onSave(selected);
        });
    }
}
