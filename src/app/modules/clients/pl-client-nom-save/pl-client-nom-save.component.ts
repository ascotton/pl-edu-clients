import { Component, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

import {PLHttpService, PLToastService, PLApiNomsService} from '@root/index';

@Component({
    selector: 'pl-client-nom-save',
    templateUrl: './pl-client-nom-save.component.html',
    styleUrls: ['./pl-client-nom-save.component.less'],
    inputs: ['service', 'nom'],
})
export class PLClientNomSaveComponent {
    @Output() onSave = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<any>();
    @Output() onDelete = new EventEmitter<any>();

    service: any = {};
    nom: any = {};

    nomSaveForm: FormGroup = new FormGroup({});
    savingNom: boolean = false;
    selectOptsNoms: any[] = [];
    selectOptsLevel: any[] = [];

    constructor(private plHttp: PLHttpService, private plToast: PLToastService,
     private plNoms: PLApiNomsService) {
    }

    ngOnInit() {
        this.formNomsOpts();
        this.formLevelOpts();
    }

    ngOnChanges(changes: any) {
        this.formNomsOpts();
        this.formLevelOpts();
    }

    formNomsOpts() {
        this.plNoms.get()
            .subscribe((res: any) => {
                this.selectOptsNoms = this.plNoms.formOpts();
            });
    }

    formLevelOpts() {
        const levels = [1, 2, 3, 4, 5, 6, 7];
        const opts: any[] = [];
        levels.forEach((level) => {
            opts.push({ value: level, label: level });
        });
        this.selectOptsLevel = opts;
    }

    save(form: any) {
        this.savingNom = true;
        const params = Object.assign({}, this.nom, {
            client_service: this.service.id,
        });
        this.plHttp.save('nomsEntry', params)
            .subscribe((res: any) => {
                this.plToast.show('success', 'Nom saved.', 2000, true);
                this.savingNom = false;
                form.reset();
                this.onSave.emit();
            }, (err: any) => {
                this.savingNom = false;
            });
    }

    cancel(form: any) {
        this.onCancel.emit();
    }

    delete(form: any) {
        this.savingNom = true;
        const params = {
            uuid: this.nom.uuid,
        };
        this.plHttp.delete('nomsEntry', params)
            .subscribe((res: any) => {
                this.plToast.show('success', 'Nom removed.', 2000, true);
                this.savingNom = false;
                form.reset();
                this.onDelete.emit();
            }, (err: any) => {
                this.savingNom = false;
            });
    }
};
