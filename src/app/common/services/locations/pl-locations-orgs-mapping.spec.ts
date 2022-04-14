import { PLLocationsOrgsMapping } from './pl-locations-orgs-mapping';
import { PLLocation } from './pl-location';
import { plLocationMock } from './pl-location.mock';
import { PLOrganization } from './pl-organization';
import { Option } from '@common/interfaces/';

describe('PLLocationsOrgsMapping', () => {
    const redSchool = plLocationMock({
        name: 'Red School',
        id: '10',
        organizationId: '0',
        organizationName: 'Spectrum District',
    });

    const orangeSchool = plLocationMock({
        name: 'Orange School',
        id: '5',
        organizationId: '0',
        organizationName: 'Spectrum District',
    });

    const yellowSchool = plLocationMock({
        name: 'Yellow School',
        id: '1',
        organizationId: '0',
        organizationName: 'Spectrum District',
    });

    const triangleSchool = plLocationMock({
        name: 'Triangle School',
        id: '100',
        organizationId: '1',
        organizationName: 'Shape District',
    });

    const virtualSchool = plLocationMock({
        name: 'Virtual School',
        id: '1000',
        organizationId: null,
        organizationName: 'Virtual District',
        isVirtual: true,
    });

    describe('getLocationCount', () => {
        it('is the length of the locations array', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);

            expect(map.getLocationCount()).toBe(2);
        });
    });

    describe('getOrganizationCount', () => {
        it('is 0 if there are no locations', () => {
            const map = new PLLocationsOrgsMapping([]);

            expect(map.getOrganizationCount()).toBe(0);
        });

        it('ignores duplicate organizations', () => {
            const map = new PLLocationsOrgsMapping([redSchool, orangeSchool, triangleSchool]);

            expect(map.getOrganizationCount()).toBe(2);
        });

        it('ignores organizations without ID', () => {
            const map = new PLLocationsOrgsMapping([virtualSchool]);

            expect(map.getOrganizationCount()).toBe(0);
        });
    });

    describe('getLocationOptions', () => {
        it('is empty if no locations', () => {
            const map = new PLLocationsOrgsMapping([]);

            expect(map.getLocationOptions()).toEqual([]);
        });

        it('maps name to label', () => {
            const map = new PLLocationsOrgsMapping([redSchool]);

            expect((map.getLocationOptions())[0].label).toEqual('Red School');
        });

        it('maps id to value', () => {
            const map = new PLLocationsOrgsMapping([redSchool]);

            expect((map.getLocationOptions())[0].value).toEqual('10');
        });

        it('is ordered by label', () => {
            const map = new PLLocationsOrgsMapping([redSchool, orangeSchool, yellowSchool, triangleSchool]);
            const expected = [orangeSchool.name, redSchool.name, triangleSchool.name, yellowSchool.name];

            expect(map.getLocationOptions().map((o: Option) => o.label)).toEqual(expected);
        });
    });

    describe('getOrganizationOptions', () => {
        it('is empty if no locations', () => {
            const map = new PLLocationsOrgsMapping([]);

            expect(map.getOrganizationOptions()).toEqual([]);
        });

        it('excludes organizations without an ID', () => {
            const map = new PLLocationsOrgsMapping([virtualSchool]);

            expect(map.getOrganizationOptions()).toEqual([]);
        });

        it('maps organizationName to label', () => {
            const map = new PLLocationsOrgsMapping([redSchool]);

            expect((map.getOrganizationOptions())[0].label).toEqual('Spectrum District');
        });

        it('maps organizationId to value', () => {
            const map = new PLLocationsOrgsMapping([redSchool]);

            expect((map.getOrganizationOptions())[0].value).toEqual('0');
        });

        it('is ordered by label', () => {
            const map = new PLLocationsOrgsMapping([redSchool, orangeSchool, yellowSchool, triangleSchool]);
            const expected = ['Shape District', 'Spectrum District'];

            expect((map.getOrganizationOptions()).map((o: Option) => o.label)).toEqual(expected);
        });
    });

    describe('getLocationForID', () => {
        it('is undefined if ID does not match a location', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);

            expect(map.getLocationForID('1234')).toBeUndefined();
        });

        it('is a location matching the ID', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);

            expect(map.getLocationForID(redSchool.id)).toBe(redSchool);
        });
    });

    describe('getLocationNameForID', () => {
        it('empty string if location ID does not match', () => {
            const map = new PLLocationsOrgsMapping([]);

            expect(map.getLocationNameForID('1')).toEqual('');
        });

        it('is the name of the location with a matching ID', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);

            expect(map.getLocationNameForID(triangleSchool.id)).toEqual('Triangle School');
        });
    });

    describe('getOrganizationForID', () => {
        const triangleDistrict: PLOrganization = {
            name: triangleSchool.organizationName,
            id: triangleSchool.organizationId,
            children: [triangleSchool.id],
        };

        it('empty string if org ID does not match', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);

            expect(map.getOrganizationForID('1234')).toBeUndefined();
        });

        it('is the org with a matching ID', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);

            expect(map.getOrganizationForID(triangleSchool.organizationId)).toEqual(triangleDistrict);
        });

        it('will include the children of the org with a matching ID', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);

            const children = map.getOrganizationForID(triangleSchool.organizationId).children;

            expect(children).toEqual(triangleDistrict.children);
        });
    });

    describe('getOrganizationNameForID', () => {
        it('empty string if org ID does not match', () => {
            const map = new PLLocationsOrgsMapping([]);

            expect(map.getOrganizationNameForID('1')).toEqual('');
        });

        it('is the name of the location with a matching ID', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);

            expect(map.getOrganizationNameForID(triangleSchool.organizationId)).toEqual('Shape District');
        });
    });

    describe('getLocationOptionsForParentOrg', () => {
        it('is all location options if parent org ID is null', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);
            const expected = [
                { value: redSchool.id, label: redSchool.name },
                { value: triangleSchool.id, label: triangleSchool.name },
            ];

            expect(map.getLocationOptionsForParentOrg(null)).toContain(expected[0]);
            expect(map.getLocationOptionsForParentOrg(null)).toContain(expected[1]);
        });

        it('is empty if parent ID does not match Option organizations', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);

            expect(map.getLocationOptionsForParentOrg('bad-ID')).toEqual([]);
        });

        it('is location options of children of organization matching parent ID', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool, orangeSchool]);

            const expected = [
                { value: redSchool.id, label: redSchool.name },
                { value: orangeSchool.id, label: orangeSchool.name },
            ];

            expect(map.getLocationOptionsForParentOrg(redSchool.organizationId)).toContain(expected[0]);
            expect(map.getLocationOptionsForParentOrg(redSchool.organizationId)).toContain(expected[1]);
        });

        it('is ordered by location name', () => {
            const map = new PLLocationsOrgsMapping([redSchool, orangeSchool, yellowSchool]);

            expect((map.getLocationOptionsForParentOrg(redSchool.organizationId))[0].label).toEqual(orangeSchool.name);
            expect((map.getLocationOptionsForParentOrg(redSchool.organizationId))[2].label).toEqual(yellowSchool.name);
        });
    });

    describe('getOrganizationOptionsByLabel', () => {
        const busSchool = plLocationMock({
            name: 'Bus School',
            id: '20',
            organizationId: '2',
            organizationName: 'Transit Unified',
        });

        it('should include all organizations when search term is empty', () => {
            const map = new PLLocationsOrgsMapping([busSchool, redSchool, triangleSchool]);

            expect(map.getOrganizationOptionsByLabel('').length).toEqual(3);
        });

        it('should include orgs with simple string matching', () => {
            const map = new PLLocationsOrgsMapping([busSchool, redSchool, triangleSchool]);

            expect(map.getOrganizationOptionsByLabel('District').map((org: Option) => org.label))
              .toEqual(['Shape District', 'Spectrum District']);
        });

        it('should include org labels that match sequentially with multi-word search terms', () => {
            const map = new PLLocationsOrgsMapping([busSchool, redSchool, triangleSchool]);

            expect(map.getOrganizationOptionsByLabel('ape District').map((orgs: Option) => orgs.label))
              .toEqual(['Shape District']);
        });

        it('should be case-insensitive', () => {
            const map = new PLLocationsOrgsMapping([busSchool, redSchool, triangleSchool]);

            expect(map.getOrganizationOptionsByLabel('district').map((o: Option) => o.label))
              .toEqual(['Shape District', 'Spectrum District']);
        });
    });

    describe('getOrganizationOptionsByIDs', () => {
        it('is empty if IDs parameter is empty', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);

            expect(map.getOrganizationOptionsByIDs([])).toEqual([]);
        });

        it('is empty if there are no matching organizations', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);

            expect(map.getOrganizationOptionsByIDs(['no-match', 'bad-id'])).toEqual([]);
        });

        it('only includes options for organizations of matching IDs', () => {
            const map = new PLLocationsOrgsMapping([redSchool, triangleSchool]);
            const orgIds = [redSchool.organizationId, triangleSchool.organizationId, 'no-match'];
            const expected = [
                { label: redSchool.organizationName, value: redSchool.organizationId },
                { label: triangleSchool.organizationName, value: triangleSchool.organizationId },
            ];

            expect(map.getOrganizationOptionsByIDs(orgIds)).toContain(expected[0]);
            expect(map.getOrganizationOptionsByIDs(orgIds)).toContain(expected[1]);
        });
    });
});
