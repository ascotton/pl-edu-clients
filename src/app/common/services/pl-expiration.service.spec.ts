import * as moment from 'moment';

import { PLExpirationService } from './';

describe('PLExpirationService', () => {
    const service = new PLExpirationService();

    describe('setTimeout', () => {
        let callback: any;

        beforeEach(() => {
            jasmine.clock().install();

            callback = jasmine.createSpy('callback');
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it('sets timeout with delay based on expiration date from now', () => {
            const shortly = moment().add(10, 'milliseconds').toDate();

            service.setTimeout(callback, shortly);

            jasmine.clock().tick(11);

            expect(callback).toHaveBeenCalled();
        });

        it('sets timeout with delay of 0 for already expired dates', () => {
            const yesterday = moment().subtract(24, 'hours').toDate();

            service.setTimeout(callback, yesterday);

            jasmine.clock().tick(1);

            expect(callback).toHaveBeenCalled();
        });
    });
});
