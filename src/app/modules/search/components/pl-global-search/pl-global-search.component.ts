import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ViewChild,
    ElementRef,
    ViewEncapsulation,
    Output,
    EventEmitter,
    ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
// RxJs
import { Observable, of, Subject } from 'rxjs';
import { filter, switchMap, first, takeUntil, withLatestFrom, tap } from 'rxjs/operators';
// NgRx Store
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import {
    filterResults,
    PLSearchLocations,
    PLSearchProviders,
    PLSearchOrganizations,
    PLSearchClients,
    selectSearchClientsCount,
    selectSearchLocationsCount,
    selectSearchProvidersCount,
    selectSearchOrganizationsCount,
    selectSearchHasCache,
    selectHistory,
    PLLoadHistory,
    PLLoadCachedSearch,
} from '../../store/search.store';
// Common
import { PLDestroyComponent } from '../../../../common/components';
import { NORMALIZE_TEXT } from '../../../../common/helpers';
// Models
import { PL_SEARCH_CATEGORY, PLSearchResult } from '../../models';
import { PLFetchSchoolYears, selectSchoolYearsState } from '@root/src/app/common/store';

enum PLSearchView {
    history = 1,
    search = 2,
}

@Component({
    selector: 'pl-global-search',
    templateUrl: './pl-global-search.component.html',
    styleUrls: ['./pl-global-search.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.ShadowDom,
})
export class PLGlobalSearchComponent extends PLDestroyComponent implements OnInit {

    private openResult$ = new Subject<any>();
    searchForm: FormGroup;
    minimalCharacters = 3;
    maxRecords = 1000;
    maxAllowRecords = 3 * this.maxRecords;
    searchResultsVisible = false;
    searchVisible = false;
    allowSearch = false;
    selectedIndex = -1;
    results: PLSearchResult[] = [];
    view: PLSearchView = PLSearchView.history;

    searchCategories: { value: string; label: string; }[] = [
        { value: PL_SEARCH_CATEGORY.All, label: 'All' },
        { value: PL_SEARCH_CATEGORY.Client, label: 'Clients' },
        { value: PL_SEARCH_CATEGORY.Provider, label: 'Providers' },
        { value: PL_SEARCH_CATEGORY.Location, label: 'Locations' },
        { value: PL_SEARCH_CATEGORY.Organization, label: 'Organizations' },
    ];
    results$: Observable<PLSearchResult[]>;

    @Output() readonly visibilityChange: EventEmitter<boolean> = new EventEmitter();
    @ViewChild('searchInput') searchInput: ElementRef;

    get searchPlaceholder() {
        const categoryId = this.searchForm.value.searchCategory;
        const category = this.searchCategories.find(i => i.value === categoryId);
        return `Search ${category.label}`;
    }

    private partialLoad(selector: any, action: any, _page?: number) {
        this.store$.select(selector).pipe(
            takeUntil(this.destroyed$),
            filter(count => count > this.maxRecords),
        ).subscribe((count: number) => {
            const tPages = Math.ceil(count / this.maxRecords);
            let page = _page || 1;
            while (tPages > page) {
                this.store$.dispatch(action({ page, limit: this.maxRecords }));
                page++;
            }
        });
    }

    private loadData() {
        const syState = this.store$.select(selectSchoolYearsState);
        this.store$.select('currentUser')
            // Do not load data until user is loaded
            .pipe(
                filter(user => !!user.uuid),
                first(),
                withLatestFrom(syState),
                switchMap(([user, _syState]) => {
                    this.store$.dispatch(PLLoadHistory({ userId: user.uuid }));
                    this.store$.dispatch(PLLoadCachedSearch({ userId: user.uuid }));
                    if (!_syState.loaded) {
                        this.store$.dispatch((PLFetchSchoolYears()));
                    }
                    return syState;
                }),
                filter(({ loaded }) => loaded),
                switchMap(() => {
                    this.store$.dispatch(PLSearchClients({ page: 0, limit: this.maxRecords }));
                    return this.store$.select(selectSearchClientsCount);
                }),
                filter(res => res !== null),
                withLatestFrom(this.store$.select(selectSearchHasCache)),
            )
            .subscribe(([clientsCount, hasCache]) => {
                this.allowSearch = !!clientsCount && clientsCount < this.maxAllowRecords;
                if (this.allowSearch && !hasCache) {
                    this.partialLoad(selectSearchClientsCount, PLSearchClients);
                    this.partialLoad(selectSearchLocationsCount, PLSearchLocations);
                    this.partialLoad(selectSearchProvidersCount, PLSearchProviders);
                    this.partialLoad(selectSearchOrganizationsCount, PLSearchOrganizations);
                    // In charge to trigger initial data
                    this.store$.dispatch(PLSearchLocations({ page: 0, limit: this.maxRecords }));
                    this.store$.dispatch(PLSearchProviders({ page: 0, limit: this.maxRecords }));
                    this.store$.dispatch(PLSearchOrganizations({ page: 0, limit: this.maxRecords }));
                }
                this.changeDetectorRef.markForCheck();
            });
    }

    private scrollToSelectedItem(idx: number) {
        const container = this.searchInput.nativeElement.parentNode.parentNode;
        const items = container.querySelectorAll('.search-scroll .search-item');
        const sItem = items[idx];
        if (sItem) {
            sItem.scrollIntoView();
        }
    }

    selectItem(item: PLSearchResult) {
        this.closeSearch();
        this.router.navigateByUrl(item.link);
    }

    closeSearch() {
        this.visibilityChange.emit(false);
        this.searchResultsVisible = false;
        this.searchForm.reset({
            searchText: '',
            searchCategory: PL_SEARCH_CATEGORY.All,
        });
    }

    openSearch() {
        this.visibilityChange.emit(true);
        // Wait for transition to finish
        setTimeout(() => this.searchInput.nativeElement.focus(), 600);
    }

    searchTextFocus() {
        this.searchResultsVisible = true;
        this.openResult$.next(this.searchForm.value);
    }

    searchTextBlur() {
        // Wait in order to give user oportunity to click on a list item
        setTimeout(() => {
            this.searchResultsVisible = false;
            // tslint:disable-next-line: max-line-length
            // Need markForCheck since setTimeout callback is not on Angular scope due to onPush Change Detection Strategy
            this.changeDetectorRef.markForCheck();
        }, 200);
    }

    hightlightText(text: string): any {
        if (this.searchForm.valid) {
            const { searchText } = this.searchForm.value;
            const regEx = new RegExp(NORMALIZE_TEXT(searchText), 'ig');
            // const normalizedText = NORMALIZE_TEXT(text);
            // const idx = normalizedText.search(regEx);
            return text.replace(regEx, '<span class="match">$&</span>');
        }
        return text;
    }

    searchKeyNavigation(event: KeyboardEvent) {
        const fowKeys = ['ArrowDown'];
        const prvKeys = ['ArrowUp'];
        if (fowKeys.includes(event.code) || prvKeys.includes(event.code)) {
            let newIdx = this.selectedIndex + (fowKeys.includes(event.code) ? 1 : -1);
            if (newIdx < 0) {
                newIdx = 0;
            }
            if (this.results.length <= newIdx) {
                newIdx = this.results.length - 1;
            }
            this.selectedIndex = newIdx;
            this.scrollToSelectedItem(this.selectedIndex);
            event.preventDefault();
        }
        const sItem = this.results[this.selectedIndex];
        if (event.code === 'Enter' && sItem) {
            this.selectItem(sItem);
        }
        if (event.code === 'Escape') {
            this.closeSearch();
        }
    }

    constructor(
        private store$: Store<AppStore>,
        private fb: FormBuilder,
        private router: Router,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super();
        this.searchForm = this.fb.group({
            searchText: ['', [Validators.required, Validators.minLength(this.minimalCharacters)]],
            searchCategory: [PL_SEARCH_CATEGORY.All, [Validators.required]],
        });
    }

    ngOnInit() {
        this.searchForm.valueChanges.pipe(
            takeUntil(this.destroyed$),
        ).subscribe(value => this.openResult$.next(value));

        this.visibilityChange.pipe(
            takeUntil(this.destroyed$),
        ).subscribe(value => this.searchVisible = value);

        this.results$ = this.openResult$.pipe(
            takeUntil(this.destroyed$),
            switchMap(({ searchText, searchCategory }) => {
                this.selectedIndex = -1;
                this.view = PLSearchView.search;
                if (this.searchForm.valid) {
                    return this.store$.select(filterResults(searchText, searchCategory));
                }
                if (searchText === '') {
                    this.view = PLSearchView.history;
                    return this.store$.select(selectHistory);
                }
                return of([]);
            }),
        );
        this.results$.subscribe(data => this.results = data);

        this.loadData();
    }
}
