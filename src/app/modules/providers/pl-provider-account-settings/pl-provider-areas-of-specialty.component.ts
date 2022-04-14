import { Component, Input } from '@angular/core';
import { PLProviderProfileService } from '@common/services';

@Component({
    selector: 'pl-provider-areas-of-specialty',
    templateUrl: './pl-provider-areas-of-specialty.component.html',
    styleUrls: ['./pl-provider-areas-of-specialty.component.less'],
})
export class PLProviderAreasOfSpecialtyComponent {
    @Input() userId: string;
    @Input() selectedAreas: any[] = [];
    @Input() onSave: Function;

    areaOptions: any[] = [];
    selectedAreaIds: any[];

    constructor(
        private plProviderProfileService: PLProviderProfileService,
    ) {}

    ngOnInit() {
        this.plProviderProfileService.getAreasOfSpecialty().subscribe((res: any) => {
            this.areaOptions = res;
        });
        this.selectedAreaIds = this.selectedAreas.map((obj: any) => obj.id);
    }

    onClickSave() {
        this.plProviderProfileService.setAreasOfSpecialty(this.userId, this.selectedAreaIds).subscribe(() => {
            const selected = this.areaOptions
                .map((obj: any) => ({ name: obj.label, id: obj.value }))
                .filter((obj: any) => this.selectedAreaIds.includes(obj.id));
            this.onSave(selected);
        });
    }
}
