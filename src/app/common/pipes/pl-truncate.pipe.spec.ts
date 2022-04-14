import { PLTruncatePipe } from './pl-truncate.pipe';

describe('PLTruncatePipe', () => {
    const pipe = new PLTruncatePipe();

    describe('transform', () => {
        it('is empty string if input is null', () => {
            expect(pipe.transform(null, 10)).toEqual('');
        });

        it('is empty string if length argument not specified', () => {
            expect(pipe.transform('whatever')).toEqual('');
        });

        it('is empty strings if input is empty', () => {
            expect(pipe.transform('', 10)).toEqual('');
        });

        it('is input string if less than max length', () => {
            expect(pipe.transform('short', 10)).toEqual('short');
        });

        it('is input string if length is equal to max length', () => {
            expect(pipe.transform('short', 5)).toEqual('short');
        });

        it('is truncated string if greater than max length', () => {
            expect(pipe.transform('superfluous', 5)).toEqual('super');
        });

        it('is truncated string plus suffix, when supplied', () => {
            expect(pipe.transform('superfluous', 5, ' 8')).toEqual('super 8');
        });
    });
});
