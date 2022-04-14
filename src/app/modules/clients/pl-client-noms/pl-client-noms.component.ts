import { Component } from '@angular/core';
import * as moment from 'moment';

import {PLHttpService, PLLodashService, PLMayService,
 PLApiNomsService} from '@root/index';

@Component({
    selector: 'pl-client-noms',
    templateUrl: './pl-client-noms.component.html',
    styleUrls: ['./pl-client-noms.component.less'],
    inputs: ['service', 'currentUser', 'client'],
})
export class PLClientNomsComponent {
    service: any = {};
    currentUser: any = {};
    client: any = {};

    reQuery: boolean = false;
    noms: any[] = [];
    columns: any = [];
    dataInfo: any = {
        count: 0,
        queryId: '',
    };

    nomSave: any = {};
    saveNomVisible: boolean = false;
    mayAddNoms: boolean = false;

    constructor(private plHttp: PLHttpService, private plLodash: PLLodashService,
     private plMay: PLMayService, private plNoms: PLApiNomsService) {
    }

    ngOnInit() {
        this.init();
    }

    ngOnChanges(changes: any) {
        this.init();
        if (changes.service) {
            this.reQuery = !this.reQuery;
        }
    }

    init() {
        this.mayAddNoms = this.plMay.editService(this.currentUser, this.client);
        this.plNoms.get()
            .subscribe((res: any) => {
                this.setColumns();
            });
    }

    toggleSaveNomVisible() {
        this.saveNomVisible = !this.saveNomVisible;
    }

    setColumns(data: any = {}) {
        this.columns = [
            { dataKey: 'uuid', title: 'Measure', filterable: false,
                htmlFn: (rowData: any, colData: any) => {
                    return rowData._nom.name;
                }
            },
            { dataKey: 'initial_value', title: 'Initial Level', filterable: false,
                htmlFn: (rowData: any, colData: any) => {
                    return `${rowData.initial_value} on ${moment(rowData.initial_at, 'YYYY-MM-DD').format('MM/DD/YYYY')}`;
                }
            },
            { dataKey: 'final_value', title: 'Final Level', filterable: false,
                htmlFn: (rowData: any, colData: any) => {
                    if (rowData.final_value && rowData.final_at) {
                        return `${rowData.final_value} on ${moment(rowData.final_at, 'YYYY-MM-DD').format('MM/DD/YYYY')}`;
                    }
                    return '';
                }
            },
        ];
    }

    onQueryTable(info: { query: any, queryId: string }) {
        let query = info.query;
        if (this.service && this.service.id) {
            const params = Object.assign({}, query, {
                client_service: this.service.id,
            });
            this.plHttp.get('nomsEntry', params)
                .subscribe((res: any) => {
                    let noms = res.results ? res.results : [];
                    // Expand (add in) nom name.
                    noms = this.plNoms.expandClientNoms(noms);
                    // Backend does not have ordering for this API so do it ourselves.
                    if (query.ordering) {
                        // Descending sort has a `-` in front.
                        let key = query.ordering;
                        let order = 'ascending';
                        if (query.ordering[0] === '-') {
                            key = query.ordering.slice(1, query.ordering.length);
                            order = 'descending';
                        }
                        // The uuid is a fake key for the measurement name.
                        if (key === 'uuid') {
                            key = '_nom.name';
                        }
                        noms = this.plLodash.sort2d(noms, key, order);
                    }
                    this.noms = noms;
                    this.dataInfo.count = res.count;
                    this.dataInfo.queryId = info.queryId;
                });
        }
    }

    onRowClick(data: { rowData: any, colData: any }) {
        if (this.mayAddNoms) {
            this.nomSave = Object.assign({}, data.rowData);
            this.toggleSaveNomVisible();
        }
    }

    addNom() {
        this.nomSave = {};
        this.toggleSaveNomVisible();
    }

    onSaveNom() {
        this.reQuery = !this.reQuery;
        this.nomSave = null;
        this.toggleSaveNomVisible();
    }
};
