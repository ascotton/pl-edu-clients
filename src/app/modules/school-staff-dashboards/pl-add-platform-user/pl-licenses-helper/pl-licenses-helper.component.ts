import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    OnDestroy,
} from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SelectionModel } from '@angular/cdk/collections';
// NgRx Store
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import {
    selectLicenses,
    selectLicensesLoading,
} from '../../store';
import { Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { PLLicenseType } from '../../models';
import { PLDestroyComponent } from '@common/components';

@Component({
    selector: 'pl-licenses-helper',
    templateUrl: './pl-licenses-helper.component.html',
    styleUrls: ['./pl-licenses-helper.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: PLLicensesHelperComponent,
        },
    ],
})
// Smart Componet so we don't have to pass so many inputs
// TODO: Rename to LicenseSelector
// TODO: Add keybord functionality
export class PLLicensesHelperComponent
    extends PLDestroyComponent
    implements OnInit, OnDestroy, ControlValueAccessor {

    private readonly gridByBreakpoint = { xl: 3, lg: 3, md: 2, sm: 2, xs: 1 };
    licenses: PLLicenseType[];
    licenses$: Observable<PLLicenseType[]> = this.store$.select(selectLicenses).pipe(
        map(licenses => licenses
            .sort((a, b) => {
                if (a.is_admin && !b.is_admin) {
                    return 1;
                }
                return (b.total_quantity | 0) - (a.total_quantity | 0);
            }).map(license => ({
                ...license,
                instructions: this.buildInstructions(license),
            }))),
    );
    loading$: Observable<boolean> = this.store$.select(selectLicensesLoading);

    @Input() value: string;
    @Output() readonly valueChange: EventEmitter<string> = new EventEmitter();

    selection = new SelectionModel<PLLicenseType>(false);
    columns$ = this.breakpointObserver.observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
    ]).pipe(
        filter(result => result.matches),
        map((result) => {
            if (result.breakpoints[Breakpoints.XSmall]) {
                return this.gridByBreakpoint.xs;
            }
            if (result.breakpoints[Breakpoints.Small]) {
                return this.gridByBreakpoint.sm;
            }
            if (result.breakpoints[Breakpoints.Medium]) {
                return this.gridByBreakpoint.md;
            }
            if (result.breakpoints[Breakpoints.Large]) {
                return this.gridByBreakpoint.lg;
            }
            if (result.breakpoints[Breakpoints.XLarge]) {
                return this.gridByBreakpoint.xl;
            }
        }),
    );
    touched = false;
    disabled = false;
    onChange: (licenseId: string) => void;
    onTouched: Function;

    constructor(
        private store$: Store<AppStore>,
        private breakpointObserver: BreakpointObserver) {
        super();
    }

    ngOnInit() {
        this.licenses$.pipe(
            takeUntil(this.destroyed$),
        ).subscribe(licenses => this.licenses = licenses);
        this.selection.changed.subscribe(() => {
            this.value = this.selection.isEmpty() ?
                '' : this.selection.selected[0].uuid;
            this.valueChange.emit(this.value);
            if (this.onChange) {
                this.onChange(this.value);
            }
            this.markAsTouched();
        });
    }

    private buildInstructions(license: PLLicenseType): string {
        let instructions = 'Can be assigned to';
        if (license.is_admin) {
            if (license.license_name.toLocaleLowerCase().includes('champion')) {
                return `Can be assigned to District Champions who will have access to provider platform plus admin dashboard`;
            }
            return `This license offers administrator access for users who do not need to use the platform for providing services`;
        }
        let { occupations } = license;
        if (license.license_name === 'Support Staff') {
            occupations = occupations.map(o => `${o}s`);
        }
        if (license.license_name === 'Therapy Essentials') {
            return `Can be assigned to any occupation that does not require assessment access`;
        }
        if (occupations.length === 1) {
            instructions += ` ${occupations[0]}`;
        } else if (occupations.length > 1) {
            instructions += ` ${occupations.slice(0, occupations.length - 1).join(', ')}`;
            instructions += ` or ${occupations[occupations.length - 1]}`;
        }
        return instructions;
    }

    select(license: PLLicenseType) {
        if (!license) {
            this.selection.clear();
        }
        if (license && license.total_quantity) {
            this.selection.select(license);
        }
    }

    writeValue(value: string) {
        this.value = value;
        const license = this.licenses.find(({ uuid }) => this.value === uuid);
        this.select(license);
    }

    registerOnChange(change: any) {
        this.onChange = change;
    }

    registerOnTouched(touched: any) {
        this.onTouched = touched;
    }

    setDisabledState(disabled: boolean) {
        // TODO: Implement Disabled State
        this.disabled = disabled;
    }

    private markAsTouched() {
        if (!this.touched) {
            this.onTouched();
            this.touched = true;
        }
    }
}
