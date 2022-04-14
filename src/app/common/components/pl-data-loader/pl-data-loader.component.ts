import {
    Input,
    OnInit,
    Component,
} from '@angular/core';

export enum PLDataLoaderType { Spinner, Bar }

@Component({
    selector: 'pl-data-loader',
    templateUrl: './pl-data-loader.component.html',
    styleUrls: ['./pl-data-loader.component.less'],
})
export class PLDataLoaderComponent implements OnInit {

    @Input() loading: boolean;
    @Input() loadingText = 'Loading';
    @Input() diameter = 28;
    @Input() type: 'spinner' | 'bar' = 'spinner';
    @Input() color: 'primary' | 'accent' = 'accent';
    @Input() mode: 'determinate' | 'indeterminate' | 'buffer' | 'query' = 'indeterminate';

    constructor() { }

    ngOnInit() { }

}
