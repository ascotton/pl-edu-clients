module.exports = class PLGQLQueriesService {
    constructor() {
        this.queries = {
            client: {
                apiName: 'client',
                cacheName: 'Client'
            },
            clientsListClients: {
                apiName: 'clients',
                cacheName: 'ClientsList'
            },
            clientServicesReferrals: {
                apiName: 'referrals',
                cacheName: 'ClientServicesReferrals'
            },
            clientServicesServices: {
                apiName: 'clientServices',
                cacheName: 'ClientServicesServices'
            },
            referralsManagerReferrals: {
                apiName: 'referrals',
                cacheName: 'ReferralManagerReferrals'
            },
            referralsOpenReferrals: {
                apiName: 'referrals',
                cacheName: 'ReferralsOpenReferrals'
            }
        };

        this.mutations = {
            referralsManagerSendToOpen: {
                apiName: 'sendToProviders',
                cacheName: 'ReferralsManagerSendToOpen'
            },
            referralsOpenMatch: {
                apiName: 'matchReferrals',
                cacheName: 'ReferralsOpenMatch'
            }
        };

        this.queryGroups = {
            referralsAndServices: [
                this.queries.client.cacheName,
                this.queries.clientsListClients.cacheName,
                this.queries.clientServicesReferrals.cacheName,
                this.queries.clientServicesServices.cacheName,
                this.queries.referralsManagerReferrals.cacheName,
                this.queries.referralsOpenReferrals.cacheName
            ]
        };
    }
};
