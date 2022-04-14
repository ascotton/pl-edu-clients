import {
    ClinicalTalkFrequency,
    referralGroupingToCheckboxValues,
    referralGroupingFromCheckboxOptionValues,
    isUpdatedClinicalTalkFrequency,
    toClinicalTalkFrequency,
} from './pl-client-referral';

describe('pl-client-referral', () => {
    describe('referralGroupingToCheckboxValues', () => {
        it('should be empty for null', () => {
            expect(referralGroupingToCheckboxValues(null)).toEqual([]);
        });

        it('should be empty for unspecified', () => {
            expect(referralGroupingToCheckboxValues('unspecified')).toEqual([]);
        });

        it('should be individual only for individual only', () => {
            expect(referralGroupingToCheckboxValues('individual_only')).toEqual(['individual_only']);
        });

        it('should be group only for group only', () => {
            expect(referralGroupingToCheckboxValues('group_only')).toEqual(['group_only']);
        });

        it('should be both group and individual when individual_or_group', () => {
            expect(referralGroupingToCheckboxValues('individual_or_group')).toEqual(['individual_only', 'group_only']);
        });
    });

    describe('referralGroupingFromCheckboxOptionValues', () => {
        it('should be unspecified if null', () => {
            expect(referralGroupingFromCheckboxOptionValues(null)).toEqual('unspecified');
        });

        it('should by unspecified if empty', () => {
            expect(referralGroupingFromCheckboxOptionValues([])).toEqual('unspecified');
        });

        it('should be individual only if individualy only', () => {
            expect(referralGroupingFromCheckboxOptionValues(['individual_only'])).toEqual('individual_only');
        });

        it('should be group only if group only', () => {
            expect(referralGroupingFromCheckboxOptionValues(['group_only'])).toEqual('group_only');
        });

        it('should by individual_or_group if both are checked', () => {
            expect(referralGroupingFromCheckboxOptionValues(['group_only', 'individual_only'])).toEqual('individual_or_group');
        });
    });

    describe('isUpdatedClinicalTalkFrequency', () => {
        const talkFrequencyMock: ClinicalTalkFrequency = {
            duration: 1,
            frequency: 1,
            interval: 'daily',
            grouping: 'group_only',
        };

        it('should be true if fields match for none of the talk frequencies in many-to-1 comparison', () => {
            const talkFrequencies = [talkFrequencyMock, { ...talkFrequencyMock, duration: 10 }];
            const newTalkFrequency = { ...talkFrequencyMock, duration: 42 };

            expect(isUpdatedClinicalTalkFrequency(talkFrequencies, newTalkFrequency)).toBeTruthy();
        });

        it('should be false if existing talk frequencies is empty', () => {
            const talkFrequencies: ClinicalTalkFrequency[] = [];
            const newTalkFrequency = { ...talkFrequencyMock };

            expect(isUpdatedClinicalTalkFrequency(talkFrequencies, newTalkFrequency)).toBeFalsy();
        });

        it('should be false if existing talk frequencies is null', () => {
            const newTalkFrequency = { ...talkFrequencyMock };

            expect(isUpdatedClinicalTalkFrequency(null, newTalkFrequency)).toBeFalsy();
        });

        it('should be false if fields match in a 1-to-1 comparison', () => {
            const talkFrequencies = [talkFrequencyMock];
            const newTalkFrequency = { ...talkFrequencyMock };

            expect(isUpdatedClinicalTalkFrequency(talkFrequencies, newTalkFrequency)).toBeFalsy();
        });

        it('should be false if at least one talk frequencies object matches', () => {
            const talkFrequencies = [talkFrequencyMock, { ...talkFrequencyMock, duration: 42 }];
            const newTalkFrequency = { ...talkFrequencyMock, duration: 42 };

            expect(isUpdatedClinicalTalkFrequency(talkFrequencies, newTalkFrequency)).toBeFalsy();
        });

        describe('field comparisons', () => {
            it('should be true when duration field differs', () => {
                const talkFrequencies = [{ ...talkFrequencyMock, duration: 1 }];
                const newTalkFrequency = { ...talkFrequencyMock, duration: 42 };

                expect(isUpdatedClinicalTalkFrequency(talkFrequencies, newTalkFrequency)).toBeTruthy();
            });

            it('should be true when frequency field differs', () => {
                const talkFrequencies = [{ ...talkFrequencyMock, frequency: 1 }];
                const newTalkFrequency = { ...talkFrequencyMock, frequency: 42 };

                expect(isUpdatedClinicalTalkFrequency(talkFrequencies, newTalkFrequency)).toBeTruthy();
            });

            it('should be true when interval field differs', () => {
                const talkFrequencies = [{ ...talkFrequencyMock, interval: 'daily' }];
                const newTalkFrequency = { ...talkFrequencyMock, interval: 'weekly' };

                expect(isUpdatedClinicalTalkFrequency(talkFrequencies, newTalkFrequency)).toBeTruthy();
            });

            it('should be true when grouping field differs', () => {
                const talkFrequencies = [{ ...talkFrequencyMock, grouping: 'group_only' }];
                const newTalkFrequency = { ...talkFrequencyMock, grouping: 'individual_only' };

                expect(isUpdatedClinicalTalkFrequency(talkFrequencies, newTalkFrequency)).toBeTruthy();
            });

            // Until service no longer lacks grouping field, consider new talk frequency
            // with grouping === null to match, if that's the only differentiating field.
            it('should be false if grouping is missing from new frequency', () => {
                const service = { duration: 1, frequency: 1, interval: 'daily' };
                const talkFrequencies = [{ ...service, grouping: 'group_only' }];
                const newTalkFrequency = toClinicalTalkFrequency(service);

                expect(isUpdatedClinicalTalkFrequency(talkFrequencies, newTalkFrequency)).toBeFalsy();
            });
        });
    });
});
