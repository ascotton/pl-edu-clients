import {
    Input,
    OnInit,
    Output,
    Component,
    OnChanges,
    EventEmitter,
    SimpleChanges,
    ChangeDetectionStrategy,
} from '@angular/core';
interface PLOption { value: string; label: string; disabled: boolean }

@Component({
    selector: 'pl-input-search-below',
    templateUrl: './pl-input-search-below.component.html',
    styleUrls: ['./pl-input-search-below.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
// TODO: Use Angular Value Accessor
export class PLInputSearchBelowComponent implements OnInit, OnChanges {

    visibleOptions: PLOption[] = [];
    selectedOptions: PLOption[];
    @Input() placeholder: string;
    @Input() label: string;
    @Input() max: number;
    @Input() value: string[] = [];
    @Input() options: PLOption[] = [];
    @Input() disabled: boolean;
    @Input() allowRemove: boolean;
    @Output() readonly valueChange: EventEmitter<string[]> = new EventEmitter();

    constructor() {}

    ngOnInit() {
        if (!this.value) {
            this.value = [];
        }
        this.setSelection();
    }

    ngOnChanges(changes: SimpleChanges) {
        const { value, options } = changes;
        if ((value && !value.firstChange) 
            || (options && !options.firstChange)) {
            this.setSelection();
        }
    }

    private setSelection() {
        this.visibleOptions = this.options.filter(o => !this.value.includes(o.value));
        this.selectedOptions = this.options.filter(o => this.value.includes(o.value));
    }

    onSelected(data: { model: string, oldVal: string }) {
        if (this.disabled) {
            return;
        }
        this.valueChange.emit([...this.value, data.model]);
    }

    onUnselect(option: PLOption) {
        this.valueChange.emit(this.value.filter(v => v !== option.value));
    }
}
