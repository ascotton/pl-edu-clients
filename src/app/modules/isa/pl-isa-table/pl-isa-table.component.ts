import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { PLISAService } from '../pl-isa.service';
import { ISAInfo, ISATableMode } from "../index";
import { PLSchoolYearsService } from '@root/src/app/common/services';
import { PLLodashService, PLGQLProviderTypesService } from '@root/index';
import { PLTableFilters } from '@root/src/app/common/interfaces/pl-table';
import { Component, Input, OnChanges, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';

interface ISATableQuery {
    page: number, 
    fullName: string,
    discipline: string, 
    schoolYear: string,
};

@Component({
  selector: 'pl-isa-table',
  templateUrl: './pl-isa-table.component.html',
  styleUrls: ['./pl-isa-table.component.less']
})
export class PLISATableComponent implements OnInit, OnChanges, OnDestroy {

    @Input() tableMode: ISATableMode;
    @Input() set isasToRemove(isasToRemove: any) {
        // Used in the scenario when user closes removal modal without removing any ISA
        isasToRemove.forEach((isaToRemove: any) => {
            if (isaToRemove.unsignReason) {
                delete isaToRemove.unsignReason;
                delete isaToRemove.unsignReasonComment;
            }
        });

        const isasArgs: ISAInfo = {
            count: 0,
            next: null,
            previous: null,
            results: isasToRemove,
        }

        this.setISAsForTable(isasArgs);
    } 

    @Output() tableDataEmitter = new EventEmitter<{ isas?: ISAInfo, selectedISAs?: any[] }>();

    isas: ISAInfo;
    isLoadingISAs = true;
    isCheckAllCheckBoxChecked = false;
    
    selectedISAs: any[] = [];

    tableFilters: PLTableFilters[] = [];

    unsignReasons: { value: string, label: string }[] = [
        { value: 'Student no longer assigned to PL', label: 'Student no longer assigned to PL' },
        { value: 'Student moved out of district', label: 'Student moved out of district' },
        { value: 'Student does not require services', label: 'Student does not require services' },
        { value: 'Other', label: 'Other' },
    ];

    private resetTableValuesAndFillItOnSubjectChanged = () => {
        this.resetValuesOfTable();
        this.fillTableWithISAs();
    };
    private isasSignedOrRemovedSubscription$: Subscription;
    
    private tableQuery: ISATableQuery;

    private NAME_FILTER: PLTableFilters = { 
        value: "fullName",
        label: "Name",
        defaultVisible: true,
    };

    private SCHOOL_YEAR_FILTER: PLTableFilters = {
        value: "schoolYearCode",
        label: "School Year",
        type: "select",
        defaultVisible: true,
    };

    private DISCIPLINE_FILTER: PLTableFilters = {
        value: "discipline",
        label: "Discipline",
        type: "select",
        defaultVisible: false,
    };

    constructor(
        private plISASvc: PLISAService,
        private plLodashSvc: PLLodashService,
        private plSchoolYearsSvc: PLSchoolYearsService,
        private plGQLProviderTypesSvc: PLGQLProviderTypesService,
    ) {}

    get isaTableMode() {
      return ISATableMode;
    }

    ngOnInit() {        
        this.buildTableFilters();
    
        this.isasSignedOrRemovedSubscription$ = this.plISASvc.isasSignedOrRemovedSubject.subscribe(
            this.resetTableValuesAndFillItOnSubjectChanged, 
            this.resetTableValuesAndFillItOnSubjectChanged
        );
    }
        
    /**
     * ISAsTableMode.CheckBoxes:
     *  - Calls the fill of the table directly; since it won't call anything auto due to lack of filters in this view.
     */
    ngOnChanges() {
        if(this.tableMode !== ISATableMode.removeISA) {
            this.resetValuesOfTable();
            if(this.tableMode === ISATableMode.manageISA) this.fillTableWithISAs();
        } else {
            this.setIsLoadingISAs(false); // When removing ISAs don't show the loader
        }
    }

    ngOnDestroy() {
        this.isasSignedOrRemovedSubscription$.unsubscribe();
    }

    /**
     * Function called by the `table-wrapper` every time a type of search is performed.
     * The search is only allo in the `Read Only` mode for now.
     * When `info.query.schoolYearCode` is undefined:
     *   - Check in the filter if there isn't actually no SY selected.
     *   - Otherwise get the current year directly from the `plISASvc`
     * 
     * @param info - The `info.query` holding all the values used in the table for performing a search.
     */
    onTableWrapperQuery(info: { query: any }) {
        if (this.tableMode === ISATableMode.readOnlyISA) {
            if(!info.query.schoolYearCode) {
                const schoolYearFilter = this.tableFilters.filter(filter => filter.value === this.SCHOOL_YEAR_FILTER.value);
                const schoolYearCode = schoolYearFilter[0].text;
    
                // TODO: if this works; remove the logic in the SVC of getting the current school year, maybe...
                info.query.schoolYearCode = schoolYearCode !== undefined ? schoolYearCode : this.plISASvc.currentSchoolYearCode;
            }
    
            const tableQueryArgs = {
                page: info.query.page,
                fullName: info.query.fullName,
                discipline: info.query.discipline,
                schoolYear: info.query.schoolYearCode,
            };
    
            this.setTableQueryValues(tableQueryArgs);
            this.fillTableWithISAs();   
        }
    }

    onCheckAllCheckboxChange() {
        this.selectedISAs = [];

        this.isas.results.forEach((isa: any) => {
            isa.selected = this.isCheckAllCheckBoxChecked;
            if (this.isCheckAllCheckBoxChecked) this.selectedISAs.push(isa); 
        });

        this.emitDataOutOfThisTable(this.isas, this.selectedISAs);
    }

    /**
     * Add or remove ISAs to the `selectedISAs` array based on checkmark
     * If checkbox is checked (isa.selected) add the isa to the array.
     * Otherwise remove it from array using the `splice` function.
     * 
     * @param isa - The ISA to be added or removed.
     */
    onSingleCheckBoxChange(isa: any) {
        if (isa.selected) {
            this.selectedISAs.push(isa);
        } else {
            let isaIndex = -1;

            for (let index = 0; index < this.selectedISAs.length; index++) {
                if (this.selectedISAs[index].uuid === isa.uuid) {
                    isaIndex = index;
                    break;
                }
            }

            if (isaIndex > -1) this.selectedISAs.splice(isaIndex, 1);
        }

        this.isCheckAllCheckBoxChecked = (this.selectedISAs.length === this.isas.results.length);
        this.emitDataOutOfThisTable(this.isas, this.selectedISAs);
    }
    
    onInputSelectChange(isa: { unsignReason: string, unsignReasonComment: string }) {
        let spliceISA = false;

        if (isa.unsignReason === 'Other') {
            spliceISA = true;
            delete isa.unsignReasonComment;
        } else {
            isa.unsignReasonComment = 'N/A';
        }

        this.emitISAsToRemove(isa, spliceISA);
    }
    
    onTextAreaChange(isa: { unsignReason: string, unsignReasonComment: string }) {
        let spliceISA = true;

        if (isa.unsignReason === 'Other' && isa.unsignReasonComment) spliceISA = false;
        
        this.emitISAsToRemove(isa, spliceISA);
    }

    //#region Private Functions

    private buildTableFilters() {
        if (!this.tableFilters.length) {
            this.tableFilters.push(this.NAME_FILTER);
            this.buildSchoolYearTableFilter();
            this.buildDisciplineTableFilter();
        }
    }

    private buildSchoolYearTableFilter() {
        this.tableFilters.push(this.SCHOOL_YEAR_FILTER);
        const index = this.plLodashSvc.findIndex(this.tableFilters, 'value', this.SCHOOL_YEAR_FILTER.value);

        this.plSchoolYearsSvc.getCurrentSchoolYearCode().pipe(first()).subscribe(
            (currentYear: string) => {
                this.tableFilters[index].text = currentYear;
                this.plISASvc.currentSchoolYearCode = currentYear;
                const schoolYears = this.plSchoolYearsSvc.getYearOptions().reverse().slice(0, 5);
                this.tableFilters[index].selectOpts = schoolYears;
            }
        );
    }
    
    private buildDisciplineTableFilter() {
        this.tableFilters.push(this.DISCIPLINE_FILTER);
        const index = this.plLodashSvc.findIndex(this.tableFilters, 'value', this.DISCIPLINE_FILTER.value);
        
        this.plGQLProviderTypesSvc.get().subscribe(() => {
            const disciplines = this.plGQLProviderTypesSvc.formOpts();
            this.tableFilters[index].selectOpts = disciplines;
        });
    }

    /**
     * Emits the ISAs to remove.
     * 
     * When not to splice:
     * If the ISA to emit is new; the ISA is inserted into the `selectedISAs` array.
     * If the ISA to emit is not new; the same `selectedISAs` are emitted:
     *   - If an unsign reason changed; that reason is already binded with the ISA object in the array.
     * 
     * When to splice:
     * Removes from the array the new ISA.
     * This is for the scenario of the `Other` reason in ISA's removal.
     * 
     * @param newIsaToRemove - The ISA object to emit
     * @param spliceISA - Tells if the newISAToRemove is to be added or removed from the array to emit
     */
    private emitISAsToRemove(newIsaToRemove: any, spliceISA = false) {
        if (spliceISA) {
            let spliced = false;

            for (let i = 0; i < this.selectedISAs.length; i++) {
                if (this.selectedISAs[i].uuid === newIsaToRemove.uuid) {
                    this.selectedISAs.splice(i, 1);
                    spliced = true;
                    break;
                }
            }

            if (spliced) this.emitDataOutOfThisTable(this.isas, this.selectedISAs);
        } else {
            const newISAInArray = this.selectedISAs.filter((isa) => isa.uuid === newIsaToRemove.uuid );

            if (!newISAInArray.length) this.selectedISAs.push(newIsaToRemove);
  
            this.emitDataOutOfThisTable(this.isas, this.selectedISAs);
        }
    }

    /**
     * Based on the `tableMode` the fill of the table will be made.
     * Only the `Read Only` mode fills the table with signed ISAs.
     * Any other mode than `Read Only` fills the table with unsigned ISAs.
     */
    private fillTableWithISAs() {
        this.setIsLoadingISAs(true);
        const signedISAs = this.tableMode === ISATableMode.readOnlyISA;

        this.plISASvc.getISAsWithFormatForTable(signedISAs, this.tableQuery).subscribe(
            (isas: ISAInfo) => {
                this.setISAsForTable(isas);
                if (this.tableMode === ISATableMode.manageISA) this.emitDataOutOfThisTable(isas, []); // TODO: check all the scenarios of this line.
                this.setIsLoadingISAs(false);
            },
            (error: any) => {
                console.log(error);
                this.setIsLoadingISAs(false);
            }
        );
    }

    private resetValuesOfTable() {
        const tableQueryArgs = {
            page: 1,
            fullName: '',
            discipline: '',
            schoolYear: this.tableMode === ISATableMode.readOnlyISA ? this.plISASvc.currentSchoolYearCode : '',
        };

        const isasArgs: ISAInfo = {
            count: 0,
            next: null,
            results: [],
            previous: null,
        }

        this.selectedISAs = [];
        this.isCheckAllCheckBoxChecked = false;

        this.setISAsForTable(isasArgs);
        this.setTableQueryValues(tableQueryArgs);
    }

    private setISAsForTable(params: ISAInfo) {
        this.isas = params;
    }

    private setIsLoadingISAs(loading: boolean) {
        this.isLoadingISAs = loading;
    }

    private setTableQueryValues(params: ISATableQuery) {
        this.tableQuery = params;
    }

    private emitDataOutOfThisTable(isas: ISAInfo, selectedISAs: any[]) {
        this.tableDataEmitter.emit({ isas, selectedISAs });
    }

    //#endregion Private Functions

}
