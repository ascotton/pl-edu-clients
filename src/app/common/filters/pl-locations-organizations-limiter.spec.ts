import { Subject } from 'rxjs';

import {
    mock,
    instance,
    when,
    anyString,
    anything,
    verify,
} from 'ts-mockito';

import {
    PLGraphQLService,
} from '@root/index';

import {
    PLLocationFilter,
    PLOrganizationFilter,
    PLLocationsOrganizationsLimiter,
} from './';

describe('PLLocationsOrganizationsLimiter', () => {
    let orgsSubject: Subject<string[]>;
    let locationsFilterMock: PLLocationFilter;
    let orgsFilterMock: PLOrganizationFilter;

    beforeEach(() => {
        orgsSubject = new Subject<string[]>();
        locationsFilterMock = mock(PLLocationFilter);
        orgsFilterMock = mock(PLOrganizationFilter);

        when(orgsFilterMock.selectedIDs()).thenReturn(orgsSubject);
    });

    describe('constructor', () => {
        it('should set accountsManagedByUser on locations filter', () => {
            const limiter = new PLLocationsOrganizationsLimiter(
                instance(locationsFilterMock),
                instance(orgsFilterMock),
                { accountsManagedByUser: 'a-user-id' },
            );

            verify(locationsFilterMock.setAccountsManagedByUser(anyString())).once();
        });

        it('should set accountsManagedByUser on organizations filter', () => {
            const limiter = new PLLocationsOrganizationsLimiter(
                instance(locationsFilterMock),
                instance(orgsFilterMock),
                { accountsManagedByUser: 'another-user-id' },
            );

            verify(orgsFilterMock.setAccountsManagedByUser(anyString())).once();
        });
    });

    describe('when organizations emits org ids', () => {
        let limiter: PLLocationsOrganizationsLimiter;
        const orgIDs = ['1', '2', '3'];

        beforeEach(() => {
            when(locationsFilterMock.limitByParentOrganizations(anything()));
            when(locationsFilterMock.updateOptions());

            limiter = new PLLocationsOrganizationsLimiter(
                instance(locationsFilterMock),
                instance(orgsFilterMock),
            );
        });

        it('limits by those parent org IDs', () => {
            orgsSubject.next(orgIDs);

            verify(locationsFilterMock.limitByParentOrganizations(orgIDs)).once();
        });

        it('updates the location filter options', () => {
            orgsSubject.next(orgIDs);

            verify(locationsFilterMock.updateOptions()).once();
        });
    });

    describe('onQuery', () => {
        let limiter: PLLocationsOrganizationsLimiter;
        const initialQuery = {
            locationsId: 'some-value',
            orgsId: 'some-other-value',
            accountsManagedByUser: '',
        };

        beforeEach(() => {
            when(locationsFilterMock.value).thenReturn('locationsId');
            when(orgsFilterMock.value).thenReturn('orgsId');

            limiter = new PLLocationsOrganizationsLimiter(
                instance(locationsFilterMock),
                instance(orgsFilterMock),
                {
                    accountsManagedByUserFilterKey: 'accountsManagedByUser',
                },
            );
        });

        describe('managed accounts', () => {
            it('will set accountsManagedByUser on locations filter', () => {
                limiter.onQuery(initialQuery);

                verify(locationsFilterMock.setAccountsManagedByUser('')).once();

                limiter.onQuery({ ...initialQuery, ...{ accountsManagedByUser: 'a-user-id' } });

                verify(locationsFilterMock.setAccountsManagedByUser('a-user-id')).once();
            });

            it('will set accountsManagedByUser on orgs filter', () => {
                limiter.onQuery(initialQuery);

                verify(orgsFilterMock.setAccountsManagedByUser('')).once();

                limiter.onQuery({ ...initialQuery, ...{ accountsManagedByUser: 'another-user-id' } });

                verify(orgsFilterMock.setAccountsManagedByUser('another-user-id')).once();
            });
        });

        describe('on the first call', () => {
            it('does not change the locations filter query parameter', () => {
                const newQueryParams = limiter.onQuery(initialQuery);

                expect(newQueryParams.locationsId).toBe('some-value');
            });

            it('does not clear locations filter selections', () => {
                limiter.onQuery(initialQuery);

                verify(locationsFilterMock.clearSelection()).never();
            });
        });

        describe('on the second call', () => {
            beforeEach(() => {
                limiter.onQuery(initialQuery);
            });

            describe('when neither accountsManagedByUser nor org filter changed', () => {
                const secondQuery = { ...initialQuery };

                it('will not clear locations filter selections', () => {
                    limiter.onQuery(secondQuery);

                    verify(locationsFilterMock.clearSelection()).never();
                });

                it('will not clear locations query parameters', () => {
                    const newQueryParams = limiter.onQuery(secondQuery);

                    expect(newQueryParams.locationsId).toBe(secondQuery.locationsId);
                });

                it('will not clear orgs filter selections', () => {
                    limiter.onQuery(secondQuery);

                    verify(orgsFilterMock.clearSelection()).never();
                });

                it('will not clear orgs query parameters', () => {
                    const newQueryParams = limiter.onQuery(secondQuery);

                    expect(newQueryParams.orgsId).toEqual(secondQuery.orgsId);
                });

                it('will not update the orgs options list', () => {
                    limiter.onQuery(secondQuery);

                    verify(orgsFilterMock.updateOptions()).never();
                });
            });

            describe('when orgs filter parameter changes', () => {
                const secondQuery = { ...initialQuery, ...{ orgsId: 'new-orgs-value' } };

                it('will clear the locations filter selections', () => {
                    limiter.onQuery(secondQuery);

                    verify(locationsFilterMock.clearSelection()).once();
                });

                it('will clear the locations query parameter', () => {
                    const newQueryParams = limiter.onQuery(secondQuery);

                    expect(newQueryParams.locationsId).toBe('');
                });

                it('will not clear orgs filter selections', () => {
                    limiter.onQuery(secondQuery);

                    verify(orgsFilterMock.clearSelection()).never();
                });

                it('will not clear orgs query parameters', () => {
                    const newQueryParams = limiter.onQuery(secondQuery);

                    expect(newQueryParams.orgsId).toEqual(secondQuery.orgsId);
                });

                it('will not update the orgs options list', () => {
                    limiter.onQuery(secondQuery);

                    verify(orgsFilterMock.updateOptions()).never();
                });
            });

            describe('when accountsManagedByUser changes', () => {
                const secondQuery = { ...initialQuery, ...{ accountsManagedByUser: 'a-user-id' } };

                it('will clear the locations filter selections', () => {
                    limiter.onQuery(secondQuery);

                    verify(locationsFilterMock.clearSelection()).once();
                });

                it('will clear the locations query parameter', () => {
                    const newQueryParams = limiter.onQuery(secondQuery);

                    expect(newQueryParams.locationsId).toBe('');
                });

                it('will clear the orgs filter selections', () => {
                    limiter.onQuery(secondQuery);

                    verify(orgsFilterMock.clearSelection()).once();
                });

                it('will clear the orgs query parameter', () => {
                    const newQueryParams = limiter.onQuery(secondQuery);

                    expect(newQueryParams.orgsId).toBe('');
                });

                it('will update the orgs options list', () => {
                    limiter.onQuery(secondQuery);

                    verify(orgsFilterMock.updateOptions()).once();
                });
            });
        });
    });
});
