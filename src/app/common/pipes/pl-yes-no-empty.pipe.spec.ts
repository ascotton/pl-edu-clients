import { PLYesNoEmptyPipe } from './pl-yes-no-empty.pipe';

describe('PLYesNoEmptyPipe', () => {
    const pipe = new PLYesNoEmptyPipe();

    describe('transform', () => {
        it('is empty string if input is null', () => {
            expect(pipe.transform(null)).toEqual('');
        });

        it('is empty string if input is empty string', () => {
            expect(pipe.transform('')).toEqual('');
        });

        it('is Yes if input is "true"', () => {
            expect(pipe.transform('true')).toEqual('Yes');
        });

        it('is Yes if input is boolean true', () => {
            expect(pipe.transform(true)).toEqual('Yes');
        });

        it('is No if input is "false"', () => {
            expect(pipe.transform('false')).toEqual('No');
        });

        it('is No if input is boolean false', () => {
            expect(pipe.transform(false)).toEqual('No');
        });

        it('is No if input is something else entirely', () => {
            expect(pipe.transform([])).toEqual('');
        });
    });
});
