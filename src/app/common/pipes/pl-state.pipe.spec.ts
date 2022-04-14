import { PLApiUsStatesService } from '@root/index';

import { PLStatePipe } from './pl-state.pipe';

import {
    instance,
    mock,
    when,
} from 'ts-mockito';

describe('PLStatePipe', () => {
    const stateServiceMock: PLApiUsStatesService = mock(PLApiUsStatesService);
    const pipe = new PLStatePipe(instance(stateServiceMock));

    describe('transform', () => {
        beforeEach(() => {
            when(stateServiceMock.getFromPostalCode('NM')).thenReturn('New Mexico');
            when(stateServiceMock.getFromPostalCode('Minn.')).thenReturn('');
            when(stateServiceMock.getFromPostalCode('')).thenReturn('');
        });

        it('returns empty string if input is null', () => {
            expect(pipe.transform(null)).toEqual('');
        });

        it('returns empty strings if input is empty', () => {
            expect(pipe.transform('')).toEqual('');
        });

        it('returns state name if called with matching postal code', () => {
            expect(pipe.transform('NM')).toEqual('New Mexico');
        });

        it('returns state name if called with matching postal code surrounded by whitespace', () => {
            expect(pipe.transform('  NM ')).toEqual('New Mexico');
        });

        it('returns original string if postal code has no match', () => {
            expect(pipe.transform('Minn.')).toEqual('Minn.');
        });
    });
});
