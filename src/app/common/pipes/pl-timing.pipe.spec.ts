import { PLTimingPipe } from './pl-timing.pipe';

describe('PLTimingPipe', () => {
    const pipe = new PLTimingPipe();

    it('it should transform empty or null to 0m', () => {
        expect(pipe.transform('')).toEqual('0m');
        expect(pipe.transform(null)).toEqual('0m');
    });

    describe('transform hh:mm:ss format to Xh Xm format', () => {
        it('it should transform 24:00:00 to 24h', () => {
            expect(pipe.transform('24:00:00')).toEqual('24h ');
        });

        it('it should transform 24:35:00 to 24h 35m', () => {
            expect(pipe.transform('24:35:00')).toEqual('24h 35m');
        });

        it('it should transform 02:05:00 to 2h 5m', () => {
            expect(pipe.transform('02:05:00')).toEqual('2h 5m');
        });

        it('it should transform 00:30:00 to 30m', () => {
            expect(pipe.transform('00:30:00')).toEqual('30m');
        });

        it('it should transform 00:05:00 to 5m', () => {
            expect(pipe.transform('00:05:00')).toEqual('5m');
        });

        it('it should transform 05:00:00 to 5h', () => {
            expect(pipe.transform('05:00:00')).toEqual('5h ');
        });
        
        it('it should transform 219:45:00 to 219h 45m', () => {
            expect(pipe.transform('219:45:00')).toEqual('219h 45m');
        });

        it('it should transform 03:08:00.000002 to 3h 8m', () => {
            expect(pipe.transform('03:08:00.000002')).toEqual('3h 8m');
        });
    });

    describe('transform hh.mm format to Xh Xm format', () => {
        it('it should transform 7.50 to 7h 30m', () => {
            expect(pipe.transform('7.50')).toEqual('7h 30m');
        });

        it('it should transform 1.83 to 1h 49m', () => {
            expect(pipe.transform('1.83')).toEqual('1h 49m');
        });

        it('it should transform 0.17 to 10m', () => {
            expect(pipe.transform('0.17')).toEqual('10m');
        });

        it('it should transform 52.92 to 52h 55m', () => {
            expect(pipe.transform('52.92')).toEqual('52h 55m');
        });

        it('it should transform 11.20 to 11h 11m', () => {
            expect(pipe.transform('11.20')).toEqual('11h 11m');
        });

        it('it should transform 1.00 to 1h', () => {
            expect(pipe.transform('1.00')).toEqual('1h ');
        });

        it('it should transform 1.08 to 1h 4m', () => {
            expect(pipe.transform('1.08')).toEqual('1h 4m');
        });

        it('it should transform 5.83 to 5h 49m', () => {
            expect(pipe.transform('5.83')).toEqual('5h 49m');
        });
    });
});
