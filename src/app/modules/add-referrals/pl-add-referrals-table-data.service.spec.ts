import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { currentUser } from '../user/current-user.store';
import { StoreModule, Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import {
    anything,
    mock,
    instance,
    when,
} from 'ts-mockito';
import { PLAddReferralsDataTableService } from './pl-add-referrals-table-data.service';
import { PLClientReferralDataModelService } from './pl-client-referral-data-model.service';

describe('PLAddReferralsDataTableService', () => {
    let service: PLAddReferralsDataTableService;
    let dataModelService: PLClientReferralDataModelService;
    let store: Store<AppStore>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({ currentUser })],
        });

        dataModelService = mock(PLClientReferralDataModelService);
        store = TestBed.get(Store);
    });

    describe('importData', () => {
        const headerRow = [
            'First Name',
            'Last Name',
            'Student ID',
            'Birth Date',
            'Provider Type',
            'Referral',
            'Notes',
        ];

        const formats = [
            Array.from({ length: 7 }, () => 'General'),
            ['General', 'General', '@', 'mm/dd/yyyy', 'General', 'General', 'General'],
        ];

        const stubValidationReturn = (service: PLClientReferralDataModelService, returnData: any[]) => {
            when(
                service.validateClientReferralData(anything(), anything(), anything()),
            ).thenReturn(
                { data: returnData, invalidFields: [] },
            );
        };

        beforeEach(() => {
            service = new PLAddReferralsDataTableService(instance(dataModelService), store);
            service.setDataFormats(formats);
        });

        describe('removing continugous whitespace characters', () => {
            const data = [
                headerRow,
                [
                    'Dale',
                    'Cooper   Smith',
                    '12345',
                    '12/01/2001',
                    'speech-language pathologist',
                    'direct therapy',
                    'three   spaces',
                ],
            ];

            beforeEach(() => {
                service.setData(data);

                const returnData = [
                    'Dale',
                    'Cooper   Smith',
                    '12345',
                    '2001-12-01',
                    'slp',
                    'direct_service',
                    'three   spaces',
                ];

                stubValidationReturn(dataModelService, returnData);

                service.importData();
            });

            xit('should remove double spaces between tokens in last name, for example', () => {
                expect(service.finalImportedData[0].lastName).toEqual('Cooper Smith');
            });

            xit('should _preserve_ double spaces in notes', () => {
                expect(service.finalImportedData[0].notes).toEqual('three   spaces');
            });
        });

        describe('stripping non-ASCII characters from fields', () => {
            const data = [
                headerRow,
                [
                    'Dale',
                    '“Cooper”',
                    '12345',
                    '12/01/2001',
                    'speech-language pathologist',
                    'direct therapy',
                    'em-dash:—',
                ],
            ];

            beforeEach(() => {
                service.setData(data);

                const returnData = ['Dale', '“Cooper”', '12345', '2001-12-01', 'slp', 'direct_service', 'em-dash:—'];
                stubValidationReturn(dataModelService, returnData);

                service.importData();
            });

            xit('will remove non-ASCII characters from notes', () => {
                expect(service.finalImportedData[0].notes).toEqual('em-dash:');
            });

            xit('will remove non-ASCII characters from last name field, for example', () => {
                expect(service.finalImportedData[0].lastName).toEqual('Cooper');
            });
        });
    });

    describe('stripUnicode', () => {
        beforeEach(() => {
            service = new PLAddReferralsDataTableService(instance(dataModelService), store);
        });

        it('returns all rows', () => {
            expect(service.stripUnicode([{}, {}]).length).toBe(2);
        });

        it('returns all fields within a row', () => {
            const fields  = Object.keys(service.stripUnicode([{ a: 'one', b: 'two' }])[0]);

            expect(fields).toContain('a');
            expect(fields).toContain('b');
        });

        it('does not modify non-strings', () => {
            const data = service.stripUnicode([{ a: 1 }]);
            expect(data[0]['a']).toEqual(1);
        });

        it('does not modify strings with only ASCII characters', () => {
            const data = service.stripUnicode([{ a: 'one' }]);
            expect(data[0]['a']).toEqual('one');
        });

        it('removes non-ASCII characters', () => {
            const data = service.stripUnicode([{ a: '“one”' }]);
            expect(data[0]['a']).toEqual('one');
        });

        it('retains ASCII base if character is in combined codepoint', () => {
            const data = service.stripUnicode([{ a: 'ñ' }]);
            expect(data[0]['a']).toEqual('n', 'did not remove tilde');
        });

        it('retains ASCII base if character is in multi-codepoint form', () => {
            // multi-codepoint form of ñ (letter N plus tilde)
            const data = service.stripUnicode([{ a: '\u006E\u02DC' }]);
            expect(data[0]['a']).toEqual('n', 'did not remove tilde');
        });
    });
});
