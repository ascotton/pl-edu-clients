import { Injectable, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as moment from 'moment';

import { PLGraphQLService, PLGQLQueriesService, PLHttpService, PLTimezoneService, PLUrlsService }
    from '@root/index';

import { PLClientMergeService } from '../pl-client-merge.service';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';

@Injectable()
export class PLCompareClientsService {

    private userTimezone: string;

    // optional fields, only displayed if different
    readonly optionalPrimitiveFields = ['grade', 'sex',  'phone', 'email', 'contactPreference',
        'timezone',  'strategies', 'teletherapyInformedConsent', 'englishLanguageLearnerStatus'];

    constructor(private clientMergeService: PLClientMergeService,
                private plGraphQL: PLGraphQLService,
                private plGQLQueries: PLGQLQueriesService,
                private plHttp: PLHttpService,
                private plTimezone: PLTimezoneService,
                private plUrls: PLUrlsService,
                store: Store<AppStore>) {

        store.select('currentUser').subscribe((user: any) => {
            this.userTimezone = plTimezone.getUserZone(user);
        });
    }

    validateClientMerge(fromClientId: string, toClientId: string) {
        return new Observable((observer: any) => {
            const variables = {
                fromClientId,
                toClientId,
            };
            // if it's a validation function, supress default error handdling, we do it here.
            const suppressErrorFunction = (err: any) => {
                return err.status === 'validation_error';
            }
            this.plGraphQL.mutate(
                `mutation mc($fromClientId: ID!, $toClientId: ID!) {
                    validateClientMerge(input: {clientMerge: {fromClientId: $fromClientId, toClientId: $toClientId}}) {
                        status
                        errors {
                            code
                            message
                            field
                        }
                    }
                }`,
                variables, { suppressErrorFunction }).subscribe(
                    (result: any) => {
                        observer.next(result);
                    },
                    (err: any) => {
                        observer.error({
                            errorMessage: err.data.validateClientMerge.errors[0].message,
                            errorCode: err.data.validateClientMerge.errors[0].code,
                        });
                    }
                );
        });
    }

    loadClients(id1: string, id2: string) {
        return new Observable((observer: any) => {
            let client1: any;
            let client2: any;

            const checkLoaded = () => {
                if (client1 && client2) {
                    this.parseClients(client1, client2).subscribe((clients: any) => {
                        observer.next(clients);
                    });
                }
            };

            this.getClient(id1).subscribe((res: any) => {
                client1 = res;
                checkLoaded();
            });

            this.getClient(id2).subscribe((res: any) => {
                client2 = res;
                checkLoaded();
            });
        });
    }

    // determine initial primary
    // delete any optional client properties that are identical in each, only retain diffs
    // format fields
    private parseClients(client1: any, client2: any) {
        let leftClient: any;
        let rightClient: any;
        let primary: string;
        let diffFields: string[] = [];

        return new Observable((observer: any) => {

            if (moment(client1.lastEvenDate).isBefore(moment(client2.lastEvenDate))) {
                primary = client1.id;
                leftClient = Object.assign({}, client1);
                rightClient = Object.assign({}, client2);
            } else {
                primary = client2.id;
                leftClient = Object.assign({}, client2);
                rightClient = Object.assign({}, client1);
            }

            // for each primitive field, use a simple equality to determine if they are different
            diffFields = this.optionalPrimitiveFields.filter((field: string) => {
                return leftClient[field] !== rightClient[field];
            });

            // diff the addresses based on the concatenation of all the address fields
            // if we're retaining address, add a formatted address line for display
            if (leftClient.street + leftClient.city + leftClient.state + leftClient.postalCode !==
                rightClient.street + rightClient.city + rightClient.state + rightClient.postalCode) {
                this.formatAddress(leftClient);
                this.formatAddress(rightClient);
                diffFields.push('address');
            }

            // compare languages by code
            if (!(leftClient.primaryLanguage && rightClient.primaryLanguage &&
                leftClient.primaryLanguage.code === rightClient.primaryLanguage.code)) {
                diffFields.push('primaryLanguage');
                leftClient.primaryLanguageName = leftClient.primaryLanguage ? leftClient.primaryLanguage.name : '';
                rightClient.primaryLanguageName = rightClient.primaryLanguage ? rightClient.primaryLanguage.name : '';
            }
            if (!(leftClient.secondaryLanguage && rightClient.secondaryLanguage &&
                leftClient.secondaryLanguage.code === rightClient.secondaryLanguage.code)) {
                diffFields.push('secondaryLanguage');
                leftClient.secondaryLanguageName =
                    leftClient.secondaryLanguage ? leftClient.secondaryLanguage.name : '';
                rightClient.secondaryLanguageName =
                    rightClient.secondaryLanguage ? rightClient.secondaryLanguage.name : '';
            }

            // if each has the same number of races, then we need to check for identical sets
            if (leftClient.races.length === rightClient.races.length) {
                let same = true;
                // iterate through each of the leftClient races, and attempt to find each one in rightClient
                leftClient.races.forEach((race: any) => {
                    const compare = (other:any) => race.code === other.code;
                    same = same && rightClient.races.find(compare);
                });
                if (!same) {
                    diffFields.push('races');
                }
            } else {
                diffFields.push('races');
            }
            this.formatRaces(leftClient);
            this.formatRaces(rightClient);

            // if each has the same number of ethnicities, then we need to check for identical sets
            if (leftClient.ethnicities.length === rightClient.ethnicities.length) {
                let same = true;
                leftClient.ethnicities.forEach((eth: any) => {
                    const compare = (other:any) => eth.code === other.code;
                    same = same && rightClient.ethnicities.find(compare);
                });
                if (!same) {
                    diffFields.push('ethnicities');
                }
            } else {
                diffFields.push('ethnicities');
            }
            this.formatEthnicities(leftClient);
            this.formatEthnicities(rightClient);

            leftClient.name = `${leftClient.firstName} ${leftClient.lastName}`;
            rightClient.name = `${rightClient.firstName} ${rightClient.lastName}`;

            leftClient.birthdayFormatted = this.formatDate(leftClient.birthday);
            leftClient.lastEvenDateFormatted = this.formatDate(leftClient.lastEvenDate);
            rightClient.birthdayFormatted = this.formatDate(rightClient.birthday);
            rightClient.lastEvenDateFormatted = this.formatDate(rightClient.lastEvenDate);

            this.formatEnumValues(leftClient);
            this.formatEnumValues(rightClient);

            leftClient.locationName = leftClient.locations[0].name;
            leftClient.locationId = leftClient.locations[0].id;

            rightClient.locationName = rightClient.locations[0].name;
            rightClient.locationId = rightClient.locations[0].id;

            observer.next({
                primary,
                diffFields,
                leftClient,
                rightClient,
            });
        });
    }

    // this formats enum value of the form: 'ENUM_VALUE_STRING' to the form 'Enum Value String'
    private formatEnumValues(client: any) {
        const capitalize = (token:string) => `${token.charAt(0)}${token.toLowerCase().slice(1)}`;

        const splitAndCapitalize = (val: string) => {
            return val.split('_').reduce(
                (formatted: string, token:string) =>  `${formatted} ${capitalize(token)}`,
                '',
            );
        };

        ['contactPreference', 'englishLanguageLearnerStatus', 'teletherapyInformedConsent'].forEach(
            (field:string) => {
                client[field + 'Formatted'] = client[field] ? splitAndCapitalize(client[field]) : '';
            },
        );
    }

    private formatRaces(client: any) {
        client.racesFormatted = client.races.map((race:any) => race.name).join('; ');
    }

    private formatEthnicities(client: any) {
        client.ethnicitiesFormatted =  client.ethnicities.map((ethnicity:any) => ethnicity.name).join('; ');
    }

    private formatAddress(client: any) {
        client.addressLine1 = client.street;
        client.addressLine2 = '';
        if (client.city) {
            client.addressLine2 += client.city;
            if (client.state) {
                client.addressLine2 += ', ' + client.state;
            }
        } else if (client.state) {
            client.addressLine2 += client.state;
        }
        if (client.postalCode) {
            client.addressLine2 += ' ' + client.postalCode;
        }
        client.addressLine2.trim();
    }

    private formatDate(dateString: string) {
        if (dateString) {
            return this.plTimezone.toUserZone(dateString, null, this.userTimezone).format('M/D/YYYY');
        } else {
            return 'No documented event found';
        }
    }


    /*
     * Client Fields to always Display (fields that are selectable are marked with asterisk):
     * Date of Last Event, Full Name*, Date of Birth*, Student ID*, Location (Site), Active Referral(s),
     * Active Service(s)
     *
     * Client Fields to display if they are different in primary vs replica (all of these are selectable):
     * Grade, Sex, Address, Phone Number, Email, Contact Preference, Timezone, Primary Language, Secondary Language,
     * Race, Ethnicity, Strategies, Teletherapy Informed Consent
     */

    private getClient(id: string) {
        return new Observable((observer: any) => {
            const variables = {
                id,
            };
            this.plGraphQL.query(`query ${this.plGQLQueries.queries.client.cacheName}($id: ID!) {
                ${this.plGQLQueries.queries.client.apiName}(id: $id) {
                    id
                    firstName
                    lastName
                    externalId
                    birthday
                    primaryLanguage {
                        id
                        code
                        name
                    }
                    secondaryLanguage {
                        id
                        code
                        name
                    }
                    englishLanguageLearnerStatus
                    locations {
                        edges {
                            node {
                                id
                                name
                                state
                                parent {
                                    id
                                    name
                                }
                            }
                        }
                    }
                    grade
                    gradeDisplay
                    email
                    phone
                    contactPreference
                    timezone
                    strategies
                    city
                    street
                    state
                    postalCode
                    sex
                    races {
                        edges {
                            node {
                                id
                                name
                            }
                        }
                    }
                    ethnicities {
                        edges {
                            node {
                                id
                                name
                            }
                        }
                    }
                    teletherapyInformedConsent
                }
            }`,
            { id }, {}).subscribe((res: any) => {
                const client = res.client;

                let lastEventDateloaded = false;
                let servicesLoaded = false;
                let learningCoachLoaded = false;
                let referralsLoaded = false;

                const checkAllLoaded = () => {
                    if (lastEventDateloaded && servicesLoaded && learningCoachLoaded && referralsLoaded) {
                        observer.next(client);
                    }
                };

                this.getLastEventDate(id).subscribe((date: string) => {
                    client.lastEvenDate = date;
                    lastEventDateloaded = true;
                    checkAllLoaded();
                });
                this.getLearningCoach(id).subscribe((coach: string) => {
                    client.learningCoach = coach;
                    learningCoachLoaded = true;
                    checkAllLoaded();
                });
                this.getServices(id).subscribe((services: any) => {
                    client.services = services;
                    servicesLoaded = true;
                    checkAllLoaded();
                });
                this.getReferrals(id).subscribe((referrals: any) => {
                    client.referrals = referrals;
                    referralsLoaded = true;
                    checkAllLoaded();
                });
            });
        });
    }

    private getLastEventDate(clientId: string) {
        return new Observable((observer: any) => {
            // Reset.
            const params: any = {
                client: clientId,
                expand: ['appointment'],
                ordering: '-appointment__start',
                limit: 1,
            };
            this.plHttp.get('records', params)
                .subscribe((res: any) => {
                    if (res.results.length) {
                        observer.next(res.results[0].appointment_expanded.start);
                    } else {
                        observer.next(null);
                    }
                });
        });
    }

    private getReferrals(clientId: string) {
        return new Observable((observer: any) => {
            this.plGraphQL.query(
                `query ${this.plGQLQueries.queries.clientServicesReferrals.cacheName}($clientId: String) {
                    ${this.plGQLQueries.queries.clientServicesReferrals.apiName}(clientId: $clientId) {
                        totalCount
                        edges {
                            node {
                                id
                                state
                                providerType {
                                    id
                                    longName
                                }
                                productType {
                                    id
                                    code
                                }
                            }
                        }
                    }
                }`,
                { clientId }, {}).subscribe((results: any) => {
                    const referralNames: string[] = results.referrals.filter((referral: any) => {
                        // return (referral.productType.code === 'direct_service') ? true : false;
                        return referral.state !== 'DELETED'
                    }).map((result: any) => result.providerType.longName).join(', ');
                    observer.next(referralNames);
                });
        });
    }

    private getServices(clientId: string) {
        return new Observable((observer: any) => {
            this.plGraphQL.query(
                `query ${this.plGQLQueries.queries.clientServicesServices.cacheName}($clientId: ID) {
                    ${this.plGQLQueries.queries.clientServicesServices.apiName}(clientId: $clientId) {
                        edges {
                            node {
                                ... on DirectService {
                                    id
                                    service {
                                        id
                                        isActive
                                        code
                                        name
                                    }
                                }
                            }
                        }
                    }
                }`,
                { clientId }, {}).subscribe((results: any) => {
                    const serviceNames: string[] =
                        results.clientServices.filter((result:any) => {
                            return result.service && result.service.name && result.service.name.length;
                        }).map((result: any) => result.service.name).join(', ');
                    observer.next(serviceNames);
                });
        });
    }

    private getLearningCoach(clientId: string) {
        return new Observable((observer: any) => {
            const params = Object.assign({}, {}, {
            });
            const url = `${this.plUrls.urls.clients}${clientId}/contacts/`;
            this.plHttp.get('', params, url)
                .subscribe((res: any) => {
                    const contacts = res.results ? res.results : [];
                    const coaches = contacts.filter((contact: any) => contact.is_responsible_party);
                    const coach =  coaches.length ? `${coaches[0].first_name} ${coaches[0].last_name}` : '';
                    observer.next(coach);
                });
        });
    }

    getMergeValues(primary: string, fields: string[], selections: any, leftClient: any, rightClient: any) {
        const mergeVals: any = {};
        fields.forEach((field: string) => {
            const selectedClient = selections[field] === leftClient.id ? leftClient : rightClient;
            if (field === 'address') {
                mergeVals.street = selectedClient.street;
                mergeVals.city = selectedClient.city;
                mergeVals.state = selectedClient.state;
                mergeVals.postalCode = selectedClient.postalCode;
            } else if (field === 'name') {
                mergeVals.firstName = selectedClient.firstName;
                mergeVals.lastName = selectedClient.lastName;
            } else if (field === 'primaryLanguage') {
                mergeVals.primaryLanguageCode =
                    selectedClient.primaryLanguage ? selectedClient.primaryLanguage.code : null;
            } else if (field === 'secondaryLanguage') {
                mergeVals.secondaryLanguageCode =
                    selectedClient.secondaryLanguage ?selectedClient.secondaryLanguage.code : null;
            } else if (field === 'races') {
                mergeVals.raceIds = selectedClient.races.map((race: any) => {
                    return race.id;
                });
            } else if (field === 'ethnicities') {
                mergeVals.ethnicityIds = selectedClient.ethnicities.map((ethnicity: any) => {
                    return ethnicity.id;
                });
            } else {
                mergeVals[field] = selectedClient[field];
            }
        });
        return mergeVals;
    }

    private concat(leftClient: any, rightClient: any, field: string) {
        const left = leftClient[field];
        const right = rightClient[field];
        if (left && left.length) {
            if (right && right.length) {
                return left + ', ' + right;
            }
            return left;
        }
        if (right && right.length) {
            return right;
        }
        return '';
    }

    getFormattedMergeValues(primary: string, fields: string[], selections: any, leftClient: any, rightClient: any) {
        const primaryClient = primary === leftClient.id ? leftClient : rightClient;
        const clients = {};
        clients[leftClient.id] = leftClient;
        clients[rightClient.id] = rightClient;
        console.log('selections: ', selections);

        const formattedVals: any = {
            name: selections.name ? clients[selections.name].name : '',
            lastEvenDateFormatted: primaryClient.lastEvenDateFormatted,
            birthdayFormatted: selections.birthday ? clients[selections.birthday].birthdayFormatted : '',
            locationName: leftClient.locationName,
            referrals: this.concat(leftClient, rightClient, 'referrals'),
            services: this.concat(leftClient, rightClient, 'services'),
            learningCoach: this.concat(leftClient, rightClient, 'learningCoach'),
            gradeDisplay: selections.grade ? clients[selections.grade].gradeDisplay : '',
            addressLine1: selections.address ? clients[selections.address].addressLine1 : '',
            addressLine2: selections.address ? clients[selections.address].addressLine2 : '',
            contactPreferenceFormatted: selections.contactPreference ?
                clients[selections.contactPreference].contactPreferenceFormatted : '',
            englishLanguageLearnerStatusFormatted: selections.englishLanguageLearnerStatus ?
                clients[selections.englishLanguageLearnerStatus].englishLanguageLearnerStatusFormatted : '',
            primaryLanguageName: selections.primaryLanguage ?
                clients[selections.primaryLanguage].primaryLanguageName : '',
            secondaryLanguageName: selections.secondaryLanguage ?
                clients[selections.secondaryLanguage].secondaryLanguageName : '',
            teletherapyInformedConsentFormatted: selections.teletherapyInformedConsent ?
                clients[selections.teletherapyInformedConsent].teletherapyInformedConsentFormatted : '',
            racesFormatted: selections.races ? clients[selections.races].racesFormatted : 'test',
            ethnicitiesFormatted: selections.ethnicities ? clients[selections.ethnicities].ethnicitiesFormatted : 'test',
        };

        return formattedVals;
    }

}
