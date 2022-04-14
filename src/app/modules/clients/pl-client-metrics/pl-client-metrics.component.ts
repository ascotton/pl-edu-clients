import { Component } from '@angular/core';
import * as moment from 'moment';

import {PLHttpService, PLLodashService, PLMayService} from '@root/index';
import { PLUtilService } from '@common/services';

@Component({
    selector: 'pl-client-metrics',
    templateUrl: './pl-client-metrics.component.html',
    styleUrls: ['./pl-client-metrics.component.less'],
    inputs: ['service', 'currentUser', 'client'],
})
export class PLClientMetricsComponent {
    service: any = {};
    currentUser: any = {};
    client: any = {};

    reQuery: boolean = false;
    metrics: any[] = [];
    columns: any = [];
    dataInfo: any = {
        count: 0,
        queryId: '',
    };

    metricSave: any = {};
    saveMetricVisible: boolean = false;
    mayAddMetrics: boolean = false;
    private columnNamesSet: boolean = false;

    constructor(
        private plHttp: PLHttpService,
        private plLodash: PLLodashService,
        private plMay: PLMayService,
        private util: PLUtilService,
     ) {
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
        this.setColumns();
        this.mayAddMetrics = this.plMay.editService(this.currentUser, this.client);
    }

    toggleSaveMetricVisible() {
        this.saveMetricVisible = !this.saveMetricVisible;
    }

    setColumns(data: any = {}) {
        const twoMonthsAgoTitle = data.month_minus_2_date ?
         `${moment(data.month_minus_2_date, 'YYYY-MM-DD').format('MMM')} Avg` : '2 Months Ago Avg';
        const oneMonthAgoTitle = data.month_minus_1_date ?
         `${moment(data.month_minus_1_date, 'YYYY-MM-DD').format('MMM')} Avg` : 'Last Month Avg';
        const currentMonthTitle = data.current_month_date ?
         `${moment(data.current_month_date, 'YYYY-MM-DD').format('MMM')} Avg` : 'This Month Avg';
        this.columns = [
            { dataKey: 'name', title: 'Short Name', filterable: false },
            { dataKey: 'month_minus_2_average', title: twoMonthsAgoTitle, filterable: false,
                htmlFn: (rowData: any, colData: any) => {
                    return `${rowData.month_minus_2_average}%`;
                }
            },
            { dataKey: 'month_minus_1_average', title: oneMonthAgoTitle, filterable: false,
                htmlFn: (rowData: any, colData: any) => {
                    return `${rowData.month_minus_1_average}%`;
                }
            },
            { dataKey: 'current_month_average', title: currentMonthTitle, filterable: false,
                htmlFn: (rowData: any, colData: any) => {
                    return `${rowData.current_month_average}%`;
                }
            },
            { dataKey: 'total_average', title: 'Total', filterable: false,
                htmlFn: (rowData: any, colData: any) => {
                    return `${rowData.total_average}%`;
                }
            },
            { dataKey: 'goal', title: 'Goal', filterable: false,
                htmlFn: (rowData: any, colData: any) => {
                    return `${rowData.goal}%`;
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
            this.plHttp.get('metrics', params)
                .subscribe((res: any) => {
                    this.util.flagLocalStorage('MOCK_OLD_METRICS') && (res = MOCK_OLD_METRICS);
                    let metrics = res.results ? res.results : [];
                    // Backend does not have ordering for this API so do it ourselves.
                    if (query.ordering) {
                        // Descending sort has a `-` in front.
                        let key = query.ordering;
                        let order = 'ascending';
                        if (query.ordering[0] === '-') {
                            key = query.ordering.slice(1, query.ordering.length);
                            order = 'descending';
                        }
                        metrics = this.plLodash.sort2d(metrics, key, order);
                    }
                    this. metrics = metrics;
                    this.dataInfo.count = res.count;
                    this.dataInfo.queryId = info.queryId;
                    // Column headers need to be updated (once) with the months.
                    if (!this.columnNamesSet) {
                        this.columnNamesSet = true;
                        this.setColumns(this.metrics[0]);
                    }
                });
        }
    }

    onRowClick(data: { rowData: any, colData: any }) {
        if (this.mayAddMetrics) {
            this.metricSave = Object.assign({}, data.rowData);
            this.toggleSaveMetricVisible();
        }
    }

    addMetric() {
        this.metricSave = {};
        this.toggleSaveMetricVisible();
    }

    onSaveMetric() {
        this.reQuery = !this.reQuery;
        this.metricSave = null;
        this.toggleSaveMetricVisible();
    }
};

const MOCK_OLD_METRICS: any = { "count": 4, "next": null, "previous": null, "results": [{ "uuid": "49bb6959-590e-458e-b3a1-6ccadac018da", "created": "2017-03-15T19:23:59.377171Z", "modified": "2017-05-10T00:52:09.819142Z", "created_by": "5a969a6b-025a-4fd7-9234-0c5c640cd18d", "modified_by": "5a969a6b-025a-4fd7-9234-0c5c640cd18d", "name": "PRODUCE SPEECH SOUNDS CLEARLY", "description": "Given a structured language activity, Abel will correctly produce the /p, b, t, d, k, g, l, s,z/ and /s/ cluster sounds at the conversation level with 80% accuracy and minimal clinician prompting over four sessions.", "client_service": "ee972bff-702a-41f6-8048-eccd7d75e1c3", "goal": 80, "total_average": 0, "current_month_average": 0, "month_minus_1_average": 0, "month_minus_2_average": 0, "current_month_date": "2019-07-01", "month_minus_1_date": "2019-06-01", "month_minus_2_date": "2019-05-01" }, { "uuid": "8ba3553b-af61-4d4e-9160-6c1787643870", "created": "2017-03-15T19:25:18.873102Z", "modified": "2017-05-11T18:35:05.930382Z", "created_by": "5a969a6b-025a-4fd7-9234-0c5c640cd18d", "modified_by": "5a969a6b-025a-4fd7-9234-0c5c640cd18d", "name": "Answer wh/questions", "description": "Given a leveled text or language activity, Nariyah will answer wh- questions to show understanding with 80% accuracy and minimal clinician assistance.", "client_service": "ee972bff-702a-41f6-8048-eccd7d75e1c3", "goal": 80, "total_average": 95, "current_month_average": 0, "month_minus_1_average": 0, "month_minus_2_average": 0, "current_month_date": "2019-07-01", "month_minus_1_date": "2019-06-01", "month_minus_2_date": "2019-05-01" }, { "uuid": "a2cc79b8-3a07-4ef8-a524-d520786e40f7", "created": "2017-03-15T19:27:20.433797Z", "modified": "2017-05-11T18:26:55.019831Z", "created_by": "5a969a6b-025a-4fd7-9234-0c5c640cd18d", "modified_by": "5a969a6b-025a-4fd7-9234-0c5c640cd18d", "name": "Describe Attributes of objects", "description": "Given a structure language activity, in a grammatically correct simple sentence, Abel will describe items by quantity, size, quality, texture, location, color, etc with minimal prompting and 80% accuracy over four sessions.", "client_service": "ee972bff-702a-41f6-8048-eccd7d75e1c3", "goal": 80, "total_average": 80, "current_month_average": 0, "month_minus_1_average": 0, "month_minus_2_average": 0, "current_month_date": "2019-07-01", "month_minus_1_date": "2019-06-01", "month_minus_2_date": "2019-05-01" }, { "uuid": "c4559567-06d1-4726-a3fa-628fa2dc118a", "created": "2017-03-15T19:28:56.802668Z", "modified": "2017-05-10T00:52:10.075526Z", "created_by": "5a969a6b-025a-4fd7-9234-0c5c640cd18d", "modified_by": "5a969a6b-025a-4fd7-9234-0c5c640cd18d", "name": "Socially Problem Solve", "description": "When given a scenario or situation, Abel will respond correctly to \"what would you do if?\" questions or the current situation (express feelings, ask for help, etc.) with minimal prompting and 80% accuracy over four sessions.", "client_service": "ee972bff-702a-41f6-8048-eccd7d75e1c3", "goal": 80, "total_average": 0, "current_month_average": 0, "month_minus_1_average": 0, "month_minus_2_average": 0, "current_month_date": "2019-07-01", "month_minus_1_date": "2019-06-01", "month_minus_2_date": "2019-05-01" }] };
