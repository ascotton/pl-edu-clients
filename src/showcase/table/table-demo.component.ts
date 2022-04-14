import { Component } from '@angular/core';

import { PLLodashService } from '@root/index';

@Component({
    selector: 'table-demo',
    templateUrl: './table-demo.component.html',
    styleUrls: ['./table-demo.component.less'],
})
export class TableDemoComponent {
    dataDefault: any[] = [];
    dataNoFilters: any[] = [];
    dataColumns1: any[];
    columnDefaultsNoFilters: any = {
        filterable: false,
        click: true,
    };
    columnsCustom1: any = [
        {
            dataKey: 'zip',
            filterable: false,
            orderable: false,
            title: 'Zip Code',
            orderValue: 'zip_order',
            htmlFn: (rowData: any, colData: any) => {
                const href = `http://google.com/#q=${rowData.zip}`;
                return `<pl-icon [svg]="'pencil'"></pl-icon> <a href="${href}" target="_blank">link! ${rowData.zip}</a>`;
            },
        },
        {
            dataKey: 'first',
            click: true,
            orderDirection: 'ascending',
            filterDefaultVisible: true,
            filterTitle: 'Name',
            filterSearchKey: 'name_combined',
        },
    ];
    countNoFilters: number = 0;
    queryIdNoFilters: string = '';
    dataInfoColumns1: any = {
        pageSize: 3,
        count: 0,
        queryId: '',
        pageNumberKey: 'pageNum',
        pageSizeKey: 'paging',
        orderKey: 'order',
    };
    columns1ExpandRow: any = (rowData: any) => {
        return `<div class="padding"><b>${rowData.first} ${rowData.last}</b> ${rowData.zip}</div>`;
    };

    constructor(private plLodash: PLLodashService) {}

    formData() {
        return [
            {
                first: 'joe',
                last: 'floyd',
                zip: 12345,
                unused: 'one',
                zip_order: 12345,
                name_combined: 'joe floyd',
                email: 'joe.floyd@example.com',
            },
            {
                first: 'bob',
                last: 'burner',
                zip: 23456,
                unused: 'two',
                zip_order: 23456,
                name_combined: 'bob burner',
                email: 'bob.turner@example.com',
            },
            {
                first: 'james',
                last: 'franco',
                zip: 34567,
                unused: 'three',
                zip_order: 34567,
                name_combined: 'james franco',
                email: 'james.franco@example.com',
            },
            {
                first: 'fred',
                last: 'turner',
                zip: 45678,
                unused: 'four',
                zip_order: 45678,
                name_combined: 'fred turner',
                email: 'fred.turner@example.com',
            },
            {
                first: 'lauren',
                last: 'zelanko',
                zip: 56789,
                unused: 'five',
                zip_order: 56789,
                name_combined: 'lauren zelanko',
                email: 'lauren.zelanko@example.com',
            },
            {
                first: 'danielle',
                last: 'boller',
                zip: 67890,
                unused: 'six',
                zip_order: 67890,
                name_combined: 'danielle boller',
                email: 'danielle-boller@example.com',
            },
            {
                first: 'jane',
                last: 'fonda',
                zip: 78901,
                unused: 'seven',
                zip_order: 78901,
                name_combined: 'jane fonda',
                email: 'jane.fonda@example.com',
            },
            {
                first: 'ralph',
                last: 'nadar',
                zip: 89012,
                unused: 'eight',
                zip_order: 89012,
                name_combined: 'ralph nadar',
                email: 'ralph@unsafe-at-any-speed.com',
            },
            {
                first: 'aaron',
                last: 'cothren',
                zip: 90123,
                unused: 'nine',
                zip_order: 90123,
                name_combined: 'aaron cothren',
                email: 'i.am.aaron.cothren@example.com',
            },
            {
                first: 'christine',
                last: 'zandemier',
                zip: 11111,
                unused: 'ten',
                zip_order: 11111,
                name_combined: 'christine zandemier',
                email: 'christine+zandemier@gmail.com',
            },
        ];
    }

    onQuery(query: any, dataInfo: any, doPaging: boolean = true) {
        let data = this.formData();

        // Filter.
        data = data.filter((obj: any) => {
            for (let key in query) {
                if (obj[key] && obj[key].toString().indexOf(query[key]) < 0) {
                    return false;
                }
            }
            return true;
        });

        // Ordering.
        const orderKey = dataInfo && dataInfo.orderKey ? dataInfo.orderKey : 'ordering';
        const orderDescendingPrefix = '-';
        let order = 'ascending';
        if (query[orderKey]) {
            let orderVal = query[orderKey];
            if (orderVal.slice(0, orderDescendingPrefix.length) === orderDescendingPrefix) {
                order = 'descending';
                orderVal = orderVal.slice(orderDescendingPrefix.length, orderVal.length);
            }
            data = this.plLodash.sort2d(data, orderVal, order);
        }

        // Paging.
        const count = data.length;
        if (doPaging) {
            const pageSizeKey = dataInfo && dataInfo.pageSizeKey ? dataInfo.pageSizeKey : 'limit';
            const pageNumberKey = dataInfo && dataInfo.pageNumberKey ? dataInfo.pageNumberKey : 'page';
            let pageNumber = 1;
            let start = 0;
            let end = 0;
            let pageSize = query[pageSizeKey] ? query[pageSizeKey] : null;
            if (query[pageSizeKey]) {
                if (query[pageNumberKey]) {
                    pageNumber = query[pageNumberKey];
                }
                start = (pageNumber - 1) * pageSize;
                end = pageNumber * pageSize;
                if (start < 0) {
                    start = 0;
                }
                if (end > count) {
                    end = count;
                }
                data = data.slice(start, end);
            }
        }

        return { count, data };
    }

    onQueryDefault(query: any) {
        const retData = this.onQuery(query, {}, false);
        // Simulate backend API call loading time.
        setTimeout(() => {
            this.dataDefault = retData.data;
        }, 500);
    }

    onQueryNoFilters(info: { query: any; queryId: string }) {
        const retData = this.onQuery(info.query, {});
        this.dataNoFilters = retData.data;
        this.countNoFilters = retData.count;
        this.queryIdNoFilters = info.queryId;
    }

    onQueryColumns1(info: { query: any; queryId: string }) {
        const retData = this.onQuery(info.query, this.dataInfoColumns1);
        this.dataColumns1 = retData.data;
        this.dataInfoColumns1.count = retData.count;
        this.dataInfoColumns1.queryId = info.queryId;
    }

    onClick(rowData: any, colData: any, type: string) {
        console.log(type, 'click:', rowData[colData.dataKey], rowData, colData);
    }

    // onRowClickNoFilters(data: { rowData: any, colData: any }) {
    //     this.onClick(data.rowData, data.colData, 'row');
    // }

    // onColumnClickNoFilters(data: { rowData: any, colData: any }) {
    //     this.onClick(data.rowData, data.colData, 'column');
    // }

    onRowHrefNoFilters(rowData: any) {
        const params = {
            first: rowData.first,
        };
        return { href: '/other/step-2', hrefQueryParams: params };
    }

    onRowClickColumns1(data: { rowData: any; colData: any }) {
        this.onClick(data.rowData, data.colData, 'row');
    }

    onColumnClickColumns1(data: { rowData: any; colData: any }) {
        this.onClick(data.rowData, data.colData, 'column');
    }
}
