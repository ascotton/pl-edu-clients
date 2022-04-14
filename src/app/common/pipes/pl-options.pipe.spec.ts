import { PLOptionsPipe } from './pl-options.pipe';

describe('PLOptionsPipe', () => {
    const pipe = new PLOptionsPipe();

    describe('transform', () => {
        const options = [
            { value: 'arbitrary-value', label: 'arbitrary-label' },
            { value: 'another-value', label: 'another-label' },
        ];

        it('converts null to empty string', () => {
            expect(pipe.transform(null)).toEqual('');
        });

        it('converts value to option label', () => {
            expect(pipe.transform('arbitrary-value', options)).toEqual('arbitrary-label');
        });

        it('converts non-string values if in options', () => {
            expect(pipe.transform(42, [{ value: 42, label: 'forty two' }])).toEqual('forty two');
        });

        it('converts empty string value if in options', () => {
            expect(pipe.transform('', [{ value: '', label: '(empty)' }])).toEqual('(empty)');
        });

        it('passes through values that are not in options', () => {
            expect(pipe.transform('anomalous-value', options)).toEqual('anomalous-value');
        });

        it('passes through values if there are no options', () => {
            expect(pipe.transform('a-value')).toEqual('a-value');
        });
    });
});
