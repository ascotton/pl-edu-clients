import { Component } from '@angular/core';
import { PLLodashService } from '@root/index';

@Component({
    selector: 'table-framework-demo',
    templateUrl: './table-framework-demo.component.html',
    styleUrls: ['./table-framework-demo.component.less'],
})
export class TableFrameworkDemoComponent {
    dataDefault: any[] = [];
    totalDefault: number;
    currentPageDefault: number = 1;
    pageSizeDefault: number;
    orderDirectionDefault: any = {
        first: 'ascending',
        last: '',
    };

    dataWrapper: any[] = [];
    totalWrapper: number;
    currentPageWrapper: number = 1;
    pageSizeWrapper: number;
    orderDirectionWrapper: any = {
        first: 'ascending',
        last: '',
    };
    filterSelectOptsWrapper: any[] = [
        { value: 'first', label: 'First', defaultVisible: true, noRemove: false },
        {
            value: 'last',
            label: 'Last',
            // selectOptsMulti: [
            //     { value: 'o', label: 'o' },
            //     { value: 'b', label: 'b' },
            // ]
        },
    ];
    private currentQueryIdWrapper: string = '';

    dataFiltersSide: any[] = [];
    totalFiltersSide: number;
    currentPageFiltersSide: number = 1;
    pageSizeFiltersSide: number;
    orderDirectionFiltersSide: any = {
        first: 'ascending',
        last: '',
    };
    filtersSide: any[] = [
        { value: 'first', label: 'First' },
        {
            value: 'last',
            label: 'Last',
            // selectOptsMulti: [
            //     { value: 'o', label: 'o' },
            //     { value: 'b', label: 'b' },
            // ]
        },
    ];
    filtersVisibleSide: boolean = true;
    private currentQueryIdFiltersSide: string = '';

    dataFiltersTopGroups: any[] = [];
    totalFiltersTopGroups: number;
    currentPageFiltersTopGroups: number = 1;
    pageSizeFiltersTopGroups: number;
    orderDirectionFiltersTopGroups: any = {
        first: 'ascending',
        last: '',
    };
    filtersPrimaryTopGroups: any[] = [
        { value: 'first', label: 'First', placeholder: 'Client Name' },
    ];
    filtersSecondaryTopGroups: any[] = [
        {
            value: 'last',
            label: 'Last',
            // selectOptsMulti: [
            //     { value: 'o', label: 'o' },
            //     { value: 'b', label: 'b' },
            // ]
        },
    ];
    filtersVisibleTopGroups: boolean = true;
    private currentQueryIdFiltersTopGroups: string = '';
    orderOptionsTopGroups: any[] = [
        { value: 'first', label: 'First', key: 'first', direction: 'ascending' },
        { value: '-first', label: 'First (Z-A)', key: 'first', direction: 'descending' },
        { value: 'last', label: 'Last', key: 'last', direction: 'ascending' },
        { value: '-last', label: 'Last (Z-A)', key: 'last', direction: 'descending' },
    ];

    constructor(private plLodash: PLLodashService) {}

    ngOnInit() {
        this.dataDefault = this.formData();
        this.totalDefault = this.dataDefault.length;
        this.dataWrapper = this.formData();
        this.totalWrapper = this.dataWrapper.length;
        this.dataFiltersSide = this.formData();
        this.totalFiltersSide = this.dataFiltersSide.length;
        this.dataFiltersTopGroups = this.formData();
        this.totalFiltersTopGroups = this.dataFiltersTopGroups.length;
    }

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

    formOrderQueryDefault(dataInfo: any) {
        for (let xx in this.orderDirectionDefault) {
            this.orderDirectionDefault[xx] = xx === dataInfo.orderKey ? dataInfo.orderDirection : '';
        }
        const prefix = dataInfo.orderDirection === 'descending' ? '-' : '';
        return `${prefix}${dataInfo.orderKey}`;
    }

    onQueryDefault(info: { data: any }) {
        if (info.data.pageSize) {
            this.pageSizeDefault = info.data.pageSize;
        }
        if (info.data.currentPage) {
            this.currentPageDefault = info.data.currentPage;
        }
        const query: any = {
            limit: this.pageSizeDefault,
            page: this.currentPageDefault,
        };
        if (info.data.orderDirection && info.data.orderKey) {
            // this.orderDirectionDefault = info.data.orderDirection;
            query.ordering = this.formOrderQueryDefault(info.data);
        }
        const retData = this.onQuery(query, {}, true);
        // Simulate backend API call loading time.
        setTimeout(() => {
            this.dataDefault = retData.data;
            this.totalDefault = retData.count;
        }, 500);
    }

    onQueryWrapper(info: { query: any }) {
        const currentQueryIdWrapper: string = this.plLodash.randomString();
        this.currentQueryIdWrapper = currentQueryIdWrapper;
        const retData = this.onQuery(info.query, {}, true);
        // Simulate backend API call loading time.
        setTimeout(
            (currentQueryIdWrapperLocal: string) => {
                if (this.currentQueryIdWrapper === currentQueryIdWrapperLocal) {
                    this.dataWrapper = retData.data;
                    this.totalWrapper = retData.count;
                }
            },
            Math.floor(Math.random() * (1000 - 0 + 1)) + 0,
            currentQueryIdWrapper
        );
    }

    toggleFiltersSide(evt: any) {
        this.filtersVisibleSide = !this.filtersVisibleSide;
    }

    onQueryFiltersSide(info: { query: any }) {
        const currentQueryIdFiltersSide: string = this.plLodash.randomString();
        this.currentQueryIdFiltersSide = currentQueryIdFiltersSide;
        const retData = this.onQuery(info.query, {}, true);
        // Simulate backend API call loading time.
        setTimeout(
            (currentQueryIdFiltersSideLocal: string) => {
                if (this.currentQueryIdFiltersSide === currentQueryIdFiltersSideLocal) {
                    this.dataFiltersSide = retData.data;
                    this.totalFiltersSide = retData.count;
                }
            },
            Math.floor(Math.random() * (1000 - 0 + 1)) + 0,
            currentQueryIdFiltersSide
        );
    }

    onQueryFiltersTopGroups(info: { query: any }) {
        const currentQueryIdFiltersTopGroups: string = this.plLodash.randomString();
        this.currentQueryIdFiltersTopGroups = currentQueryIdFiltersTopGroups;
        const retData = this.onQuery(info.query, {}, true);
        // Simulate backend API call loading time.
        setTimeout(
            (currentQueryIdFiltersTopGroupsLocal: string) => {
                if (this.currentQueryIdFiltersTopGroups === currentQueryIdFiltersTopGroupsLocal) {
                    this.dataFiltersTopGroups = retData.data;
                    this.totalFiltersTopGroups = retData.count;
                }
            },
            Math.floor(Math.random() * (1000 - 0 + 1)) + 0,
            currentQueryIdFiltersTopGroups
        );
    }
}
