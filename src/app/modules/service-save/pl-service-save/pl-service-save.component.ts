import {
    Component,
    OnInit,
    OnDestroy,
    OnChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PLConfirmDialogService, PLLinkService } from '@root/index';

import { PLServiceSaveService } from '../pl-service-save.service';
import { CurrentUserService } from '../../user/current-user.service';
import { User } from '../../user/user.model';

@Component({
    selector: 'pl-service-save',
    templateUrl: './pl-service-save.component.html',
    styleUrls: ['./pl-service-save.component.less'],
})
export class PLServiceSaveComponent implements OnInit, OnChanges, OnDestroy {
    client: any = {};
    clientService: any = {};
    referralToConvert: any = {};
    convertedReferral: any = {};
    currentUser: User;
    initing = true;
    saving = false;
    steps: any[] = [];
    isEdit = false;
    backDefault = 0;
    isNoteEditing = false;
    locationId: string;

    private destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(
        private router: Router,
        private plServiceSave: PLServiceSaveService,
        private plLink: PLLinkService,
        private currentUserService: CurrentUserService,
        private confirmDialogService: PLConfirmDialogService,
    ) {}

    ngOnInit() {
        combineLatest([
            this.currentUserService.getCurrentUser(),
            this.plServiceSave.init(),
        ]).pipe(
            takeUntil(this.destroy$),
        ).subscribe(([currentUser, res]: any) => {
            this.client = res.client;
            this.clientService = res.clientService;
            this.steps = res.steps;
            this.initing = false;
            this.isEdit = res.isEdit;
            this.backDefault = res.backDefault;
            this.referralToConvert = this.plServiceSave.referral;
            this.convertedReferral = this.referralToConvert && this.referralToConvert.id
                ? this.referralToConvert
                : this.clientService.referrals.find((referral: any) => referral.schoolYear);
            this.currentUser = currentUser;
            this.setLocationId();
        });

        this.plServiceSave.getStepsUpdates().subscribe((updates: any) => {
            this.steps = [...updates.steps];
        });

        this.plServiceSave.nextStepConfirmed.pipe(
            takeUntil(this.destroy$),
        ).subscribe((options: { nextIndex: number }) => {
            this.navigateNextStep(options);
        });
    }

    ngOnChanges(changes: any) {
        this.init();
    }

    ngOnDestroy() {
        this.plServiceSave.destroy();

        this.destroy$.next(true);
        this.destroy$.complete();
    }

    init() {
        this.plServiceSave.getServices();
        this.plServiceSave.getProviderTypes();
        this.plServiceSave.getDocumentTypes();
    }

    stepsCancel(evt: any) {
        if (!this.hasValidNotes()) {
            return;
        }

        if (this.backDefault) {
            this.router.navigate(['/client', this.client.id, 'services']);
        } else {
            this.plLink.goBack(['/client', this.client.id, 'services']);
        }
    }

    stepsFinish(data: { currentIndex: number }) {
        if (!this.hasValidNotes()) {
            return;
        }

        if (this.steps[data.currentIndex].key === 'service-details') {
            this.plServiceSave.updatePsychoeducationalService();
        }
        this.saving = true;
        this.plServiceSave.submitService()
            .subscribe((res: any) => {
                this.stepsCancel({});
            }, (err: any) => {
                this.saving = false;
            });
    }

    stepsNext(data: { currentIndex: number, nextIndex: number }) {
        if (this.steps[data.currentIndex].key === 'service-details') {
            this.plServiceSave.updatePsychoeducationalService();
        }

        this.plServiceSave.requestNextStepConfirmation(data);
    }

    hasValidNotes() {
        if (!this.isNoteEditing) {
            return true;
        }

        this.confirmDialogService.show({
            header: 'Notes being edited',
            content: 'There are notes that have not been saved yet. Save or cancel notes to proceed.',
            primaryLabel: 'Close',
            primaryCallback: () => {},
        });
        return false;
    }

    onNoteEditing(isNoteEditing: boolean) {
        this.isNoteEditing = isNoteEditing;
    }

    setLocationId(): void {
        if (this.client && this.client.locations && this.client.locations.length) {
            this.locationId = this.client.locations[0].id;
        }
    }

    private navigateNextStep({ nextIndex }: { nextIndex: number }) {
        // For all steps, do the navigation.
        this.plLink.navigate(this.steps[nextIndex].href, this.steps[nextIndex].hrefQueryParams);
    }
}
