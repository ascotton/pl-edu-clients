import { PLTimeGridService } from './pl-time-grid.service';
import moment from 'moment';

describe('PLTimeGridService', () => {

    let service: PLTimeGridService;
    const _hourFormat = 'HH:mm';
    const LA_TZ = 'America/Los_Angeles';
    const NY_TZ = 'America/New_York';

    const UTCFrame = (start: string, end: string) => {
        return {
            start: moment.utc(start, _hourFormat),
            end: moment.utc(end, _hourFormat),
        };
    };

    beforeEach(() => {
        // TODO
        service = new PLTimeGridService();
    });

    it('Should be initialized', () => {
        expect(service).toBeTruthy();
    });

    xit('Should get time base on Y coordinate', () => {
        expect(service).toBeTruthy();
        const expectedTime = UTCFrame('14:00', '16:00');
        const time = service.getTime(100);
        expect(expectedTime.start.isSame(time.start))
            .toBe(true);
    });
    // overlap

    it('Should be in Time Frame', () => {
        const NYTime = service.timeObj({ start: '09:00', end: '12:00' }, NY_TZ);
        const LATime = service.timeObj({ start: '07:00', end: '08:00' }, LA_TZ);
        expect(service.inTimeFrame(NYTime, LATime.start, LATime.end)).toBe(true);
    });

    it('Should be in Time Frame (Same start)', () => {
        const NYTime = service.timeObj({ start: '09:00', end: '12:00' }, NY_TZ);
        const LATime = service.timeObj({ start: '06:00', end: '07:00' }, LA_TZ);
        expect(service.inTimeFrame(NYTime, LATime.start, LATime.end)).toBe(true);
    });

    it('Should be in Time Frame (Same end)', () => {
        const NYTime = service.timeObj({ start: '09:00', end: '12:00' }, NY_TZ);
        const LATime = service.timeObj({ start: '08:00', end: '09:00' }, LA_TZ);
        expect(service.inTimeFrame(NYTime, LATime.start, LATime.end)).toBe(true);
    });

    it('Should be in Time Frame (Same start and end)', () => {
        const NYTime = service.timeObj({ start: '09:00', end: '12:00' }, NY_TZ);
        const LATime = service.timeObj({ start: '06:00', end: '09:00' }, LA_TZ);
        expect(service.inTimeFrame(NYTime, LATime.start, LATime.end)).toBe(true);
    });

    it('Should NOT be in Time Frame', () => {
        const NYTime = service.timeObj({ start: '09:00', end: '12:00' }, NY_TZ);
        const LATime = service.timeObj({ start: '05:00', end: '06:00' }, LA_TZ);
        expect(service.inTimeFrame(NYTime, LATime.start, LATime.end)).toBe(false);
    });

    it('Should have Defualt Timezone to Los Angeles', () => {
        service.timezone = LA_TZ;
        expect(service.timezone).toBe(LA_TZ);
    });

    xit('Should convert Moment Time Frame to String Time Frame', () => {
        service.timezone = LA_TZ;
        const timeFrame = UTCFrame('14:00', '16:00');
        const timeFrameStr = service.timeBlock(timeFrame);
        expect(timeFrameStr.start).toBe('07:00', 'Start time DOES NOT Match');
        expect(timeFrameStr.end).toBe('09:00', 'End time DOES NOT Match');
    });

    xit('Should convert Los Angeles Time Frame String to Moment UTC', () => {
        const expectedTime = UTCFrame('14:00', '16:00');
        const UTCTime = service.timeObj({ start: '07:00', end: '09:00' }, LA_TZ);
        expect(expectedTime.start.isSame(UTCTime.start))
            .toBe(true, 'Start time NOT Converted to UTC');
        expect(expectedTime.end.isSame(UTCTime.end))
            .toBe(true, 'End time NOT Converted to UTC');
    });

    xit('Should convert New York Time Frame String to Moment UTC', () => {
        const expectedTime = UTCFrame('14:00', '16:00');
        const UTCTime = service.timeObj({ start: '10:00', end: '12:00' }, NY_TZ);
        expect(expectedTime.start.isSame(UTCTime.start))
            .toBe(true, 'Start time NOT Converted to UTC');
        expect(expectedTime.end.isSame(UTCTime.end))
            .toBe(true, 'End time NOT Converted to UTC');
    });

    xit('Should convert Moment UTC to Los Angeles Time Frame String', () => {
        service.timezone = LA_TZ;
        const UTCTimeFrame = service.timeObj({ start: '14:00', end: '16:00' }, '');
        const timeFrameStr = service.timeBlock(UTCTimeFrame);
        expect(timeFrameStr.start).toBe('07:00', 'Start time DOES NOT Match');
        expect(timeFrameStr.end).toBe('09:00', 'End time DOES NOT Match');
    });

    it('Should convert Moment Los Angeles to Los Angeles Time Frame String', () => {
        service.timezone = LA_TZ;
        const LATimeFrame = service.timeObj({ start: '07:00', end: '09:00' }, LA_TZ);
        const timeFrameStr = service.timeBlock(LATimeFrame);
        expect(timeFrameStr.start).toBe('07:00', 'Start time DOES NOT Match');
        expect(timeFrameStr.end).toBe('09:00', 'End time DOES NOT Match');
    });

    it('Should convert Moment New York to Los Angeles Time Frame String', () => {
        service.timezone = LA_TZ;
        const NYTimeFrame = service.timeObj({ start: '10:00', end: '12:00' }, NY_TZ);
        const timeFrameStr = service.timeBlock(NYTimeFrame);
        expect(timeFrameStr.start).toBe('07:00', 'Start time DOES NOT Match');
        expect(timeFrameStr.end).toBe('09:00', 'End time DOES NOT Match');
    });

    xit('Should convert Moment UTC to New York Time Frame String', () => {
        service.timezone = NY_TZ;
        const UTCTimeFrame = service.timeObj({ start: '11:00', end: '13:00' }, '');
        const timeFrameStr = service.timeBlock(UTCTimeFrame);
        expect(timeFrameStr.start).toBe('07:00', 'Start time DOES NOT Match');
        expect(timeFrameStr.end).toBe('09:00', 'End time DOES NOT Match');
    });

    it('Should convert Moment Los Angeles to New York Time Frame String', () => {
        service.timezone = NY_TZ;
        const LATimeFrame = service.timeObj({ start: '04:00', end: '06:00' }, LA_TZ);
        const timeFrameStr = service.timeBlock(LATimeFrame);
        expect(timeFrameStr.start).toBe('07:00', 'Start time DOES NOT Match');
        expect(timeFrameStr.end).toBe('09:00', 'End time DOES NOT Match');
    });

    it('Should convert Moment New York to New Yotk Time Frame String', () => {
        service.timezone = NY_TZ;
        const NYTimeFrame = service.timeObj({ start: '07:00', end: '09:00' }, NY_TZ);
        const timeFrameStr = service.timeBlock(NYTimeFrame);
        expect(timeFrameStr.start).toBe('07:00', 'Start time DOES NOT Match');
        expect(timeFrameStr.end).toBe('09:00', 'End time DOES NOT Match');
    });
});
