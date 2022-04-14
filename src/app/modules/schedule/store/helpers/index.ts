import { props, createAction } from '@ngrx/store';

export enum PLActionResults {
    Success = 'success',
    Fail = 'fail',
}

export const PL_CREATE_ACTIONS = <I, S>(type: string) => ({
    initial: createAction(type, props<{ payload: I}>()),
    success: createAction(`${type} ${PLActionResults.Success}`, props<{ payload: S }>()),
    fail: createAction(`${type} ${PLActionResults.Fail}`, props<{ payload?: any }>()),
});
