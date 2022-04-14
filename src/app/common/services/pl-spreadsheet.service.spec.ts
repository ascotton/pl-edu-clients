import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { PLStylesService } from '@root/index';
import { PLSpreadsheetService } from './pl-spreadsheet.service';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { PLAddReferralsDataTableService } from '../../modules/add-referrals/pl-add-referrals-table-data.service';
import { PLClientReferralDataModelService } from '../../modules/add-referrals/pl-client-referral-data-model.service';

describe('PLSpreadsheetService', () => {

    let spectator: SpectatorService<PLSpreadsheetService>;

    const storeStub = {
        select: () => {
            return new Observable((observer: any) => {
                observer.next(null);
            });
        },
    };
    const createService = createServiceFactory({
        service: PLSpreadsheetService,
        providers: [
            PLAddReferralsDataTableService, PLClientReferralDataModelService,
            PLStylesService, { provide: Store, useValue: storeStub },
        ],
    });

    beforeEach(() => spectator = createService());

    it('should succeed', () => {
        expect(spectator).toBeTruthy();
        expect(spectator).toBeDefined();
    });

});
