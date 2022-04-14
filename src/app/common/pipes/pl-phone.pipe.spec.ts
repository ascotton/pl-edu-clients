import { PLPhonePipe } from './pl-phone.pipe';

describe('PLPhonePipe', () => {
    const pipe = new PLPhonePipe();

    describe('transform', () => {
        it('converts null to empty string', () => {
            expect(pipe.transform(null)).toEqual('');
        });

        it('strips periods', () => {
            expect(pipe.transform('123.456.7890').includes('.')).toBeFalsy();
        });

        it('passes through strings with fewer than 10 digits', () => {
            expect(pipe.transform('123456')).toEqual('123456');
        });

        it('passes through strings with more than 11 digits', () => {
            expect(pipe.transform('52345678912345')).toEqual('52345678912345');
        });

        it('passes through strings with more than 10 digits that does not start with 1', () => {
            expect(pipe.transform('98765432100')).toEqual('98765432100');
        });

        it('passes through strings containing non-decoration and digit characters', () => {
            expect(pipe.transform('(123) 456-talk')).toEqual('(123) 456-talk');
        });

        it('formats phone number with 10 digits', () => {
            expect(pipe.transform('423-456-7890')).toEqual('(423) 456-7890');
        });

        it('formats phone number with 10 digits, even if it begins with a 1', () => {
            expect(pipe.transform('123-456-7890')).toEqual('(123) 456-7890');
        });

        it('formats phone number with US country code 1 followed by 10 digits', () => {
            expect(pipe.transform('1 321-456-7890')).toEqual('+1 (321) 456-7890');
        });

        it('formats phone number with 10 digits and an extension', () => {
            expect(pipe.transform('423-456-7890 x123')).toEqual('(423) 456-7890 x123');
        });
    });
});
