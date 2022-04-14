import { Component, ViewChild } from '@angular/core';
import { NgForm, FormGroup } from '@angular/forms';

@Component({
    selector: 'inputs-demo',
    templateUrl: './inputs-demo.component.html',
    styleUrls: ['./inputs-demo.component.less'],
})
export class InputsDemoComponent {
    inputsDemoForm: FormGroup = new FormGroup({});

    selectOpts: any = [];
    selectOptsBig: any = [];
    selectOptsSearch: any = [];
    selectLoading: boolean = false;
    multiSelectOptsSearch: any = [];
    multiSelectLoading: boolean = false;
    multiSelectApiModelOpts: any[] = [{ value: 'three', label: 'Three' }];
    multiSelectOptsSearchTruncated: any[] = this.multiSelectOptsSearch;
    multiSelectOptsSearchResultsTotalsCount: number = this.multiSelectOptsSearchTruncated.length;
    existingFile: any = { name: 'existing1.jpg' };
    existingFilesMultiple: any[] = [{ name: 'existing2.pdf' }, { name: 'existing3.pdf' }];

    models: any = {
        disabled: false,
        textDefault: 'text default',
        textIcon: 'text icon',
        number: 45,
        email: 'valid@email.c',
        url: 'http://google.com',
        pattern1: '0612345678',
        pattern2: 'Mike Jones',
        textarea: 'textarea here',
        selectDefault: 'one',
        selectFilter: 'two',
        selectApi: 'three',
        multiSelectDefault: ['one'],
        multiSelectFilter: ['two', 'four'],
        multiSelectApi: ['three', 'five'],
        checkbox: true,
        colors: ['blue'],
        size: 'medium',
        datepicker: '2016-12-04',
        datepickerSmallWidth: 'Nov 15, 2016',
        time: '16:34',
        time2: '3:05p',
        radio2: false,
        radio3: 0,
    };
    optionsColors = [
        { value: 'blue', label: 'Blue' },
        { value: 'green', label: 'Green' },
        { value: 'red', label: 'Red' },
    ];
    optionsSizes = [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
    ];
    optionsBooleans = [{ value: false, label: 'False' }, { value: true, label: 'True' }];
    validationMessagesPattern1: any = {
        pattern: 'Enter 06 then 8 digits',
    };

    modelsNoForm: any = {};

    constructor() {}

    ngOnInit() {
        this.selectOpts = this.formSelectOpts();
        this.selectOptsBig = this.formSelectOptsBig();
    }

    formSelectOpts() {
        return [
            { value: 'one', label: 'One' },
            { value: 'two', label: 'Two' },
            { value: 'three', label: 'Three' },
            { value: 'four', label: 'Four' },
            { value: 'five', label: 'Five' },
            { value: 'six', label: 'Six' },
            { value: 'seven', label: 'Seven' },
            { value: 'eight', label: 'Eight' },
            { value: 'nine', label: 'Nine' },
            { value: 'ten', label: 'Ten' },
        ];
    }
    formSelectOptsBig() {
        let opts = [];
        let parts = [
            'one',
            'two',
            'three',
            'alpha',
            'beta',
            'gamma',
            'foo',
            'baz',
            'bar',
            'red',
            'white',
            'blue',
            'dog',
            'cat',
            'mouse',
        ];
        for (let i = 0; i < 1000; i++) {
            let nextParts = [];
            for (let j = 0; j < 3; j++) {
                nextParts.push(parts[Math.floor(parts.length * Math.random())]);
            }
            let nextWord = nextParts.join(' ');
            opts.push({ value: nextWord, label: nextWord });
        }
        return opts;
    }

    onSearchSelect(evt: { value: string }) {
        this.selectLoading = true;
        const search = evt.value.toLowerCase();
        setTimeout(() => {
            if (!search) {
                // this.selectOptsSearch = [];
                this.selectOptsSearch = this.formSelectOpts();
            } else {
                this.selectOptsSearch = this.formSelectOpts().filter((opt: any) => {
                    return opt.value.toLowerCase().indexOf(search) > -1 ? true : false;
                });
            }
            this.selectLoading = false;
        }, 500);
    }

    onSearchMultiSelect(evt: { value: string }) {
        this.multiSelectLoading = true;
        const search = evt.value.toLowerCase();
        setTimeout(() => {
            this.multiSelectOptsSearch = this.formSelectOpts().filter((opt: any) => {
                return opt.value.toLowerCase().indexOf(search) > -1;
            });

            this.multiSelectOptsSearchResultsTotalsCount = this.multiSelectOptsSearch.length;
            this.multiSelectOptsSearchTruncated = this.multiSelectOptsSearch.slice(0, 5);

            this.multiSelectLoading = false;
        }, 500);
    }

    onChange(info: { model: any; evt: any }) {
        console.log('inputs-demo change: ', info.model);
    }

    submit(form: any) {
        console.log('submit form: ', form.valid, form.value);
    }
}
