import {
    Component,
    Input,
} from '@angular/core';

import {
    ComponentFixture,
    TestBed,
} from '@angular/core/testing';

import { PLClientService } from '../pl-client.service';
import { PLYesNoEmptyPipe, PLOptionsPipe } from '@common/pipes';

import {
    PLClientConvertedReferralListComponent,
} from './pl-client-converted-referral-list.component';
import { instance, mock } from 'ts-mockito';

describe('PLClientConvertedReferralListComponent', () => {
    let componentSvc: PLClientService;
    let component: PLClientConvertedReferralListComponent;
    let fixture: ComponentFixture<PLClientConvertedReferralListComponent>;

    beforeEach(() => {
        componentSvc = mock(PLClientService);

        TestBed.configureTestingModule({
            declarations: [PLClientConvertedReferralListComponent, PLYesNoEmptyPipe, PLOptionsPipe],
        })
        .overrideComponent(PLClientConvertedReferralListComponent, {
            set: { providers: [{ provide: PLClientService, useValue: instance(componentSvc) }] }
        })
        .compileComponents();

        fixture = TestBed.createComponent(PLClientConvertedReferralListComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('heading', () => {
        it('should be plural when there are multiple referrals', () => {
            component.referrals = [{}, {}];

            expect(component.heading().includes('Referrals')).toBeTruthy();
        });

        it('should be singular when there is a single referral', () => {
            component.referrals = [{}];

            expect(component.heading().includes('Referrals')).toBeFalsy();
            expect(component.heading().includes('Referral')).toBeTruthy();
        });

        it('should append the productType', () => {
            component.productType = 'Product';

            expect(component.heading().includes('Product')).toBeTruthy();
        });
    });

    describe('paragraphs', () => {
        it('should be empty if text is empty', () => {
            expect(component.paragraphs('')).toEqual([]);
        });

        it('should be empty if text is null', () => {
            expect(component.paragraphs(null)).toEqual([]);
        });

        it('should not split text witouth linebreaks', () => {
            const text = 'the text';

            expect(component.paragraphs(text).length).toEqual(1);
        });

        it('should split with linebreaks', () => {
            const text = 'line 1\n\nline 3';

            expect(component.paragraphs(text).length).toEqual(3);
        });

        it('should split with Windows linebreaks', () => {
            const text = 'line 1\r\nline 2\nline 3';

            expect(component.paragraphs(text)[1]).toEqual('line 2');
        });
    });

    describe('orderedReferrals', () => {
        it('should be empty if there are no referrals', () => {
            component.referrals = [];

            expect(component.orderedReferrals()).toEqual([]);
        });

        it('should still sort if the created date is missing', () => {
            component.referrals = [
                // No date — assume it's the beginning of the Epoch.
                { id: 1, created: null },
                { id: 2, created: '2018-01-22T00:00:00.000000+00:00' },
            ];

            expect(component.orderedReferrals().map(r => r.id)).toEqual([2, 1]);
        });

        it('should order later referrals before newer ones', () => {
            component.referrals = [
                // Jan 22
                { id: 1, created: '2018-01-22T00:00:00.000000+00:00' },
                // Jan 1
                { id: 2, created: '2018-01-01T00:00:00.000000+00:00' },
                // Feb 1
                { id: 3, created: '2018-02-01T00:00:00.000000+00:00' },
            ];

            expect(component.orderedReferrals().map(r => r.id)).toEqual([3, 1, 2]);
        });
    });
});
