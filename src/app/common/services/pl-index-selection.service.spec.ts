import { PLIndexSelectionService } from './pl-index-selection.service';

describe('IndexSelectionService', () => {
    let selection: PLIndexSelectionService;

    beforeEach(() => {
        selection = new PLIndexSelectionService();
    });

    describe('constructor', () => {
        it('takes a selection parameter', () => {
            const selection = new PLIndexSelectionService(1);

            expect(selection.isSelected(1)).toBeTruthy();
        });

        it('takes a null selection parameter to indicate no selection', () => {
            const selection = new PLIndexSelectionService(null);

            expect(selection.hasSelection()).toBeFalsy();
        });

        it('defaults to no selection', () => {
            const selection = new PLIndexSelectionService();

            expect(selection.hasSelection()).toBeFalsy();
        });
    })

    describe('clear', () => {
        it('returns itself', () => {
            expect(selection.clear()).toBe(selection);
        });

        it('removes the selection', () => {
            selection.toggle(1);

            selection.clear();

            expect(selection.hasSelection()).toBeFalsy();
        });
    });

    describe('isSelected', () => {
        it('is false when none are selected', () => {
            expect(selection.isSelected(1)).toBeFalsy();
        });

        it('is false when an other is selected', () => {
            selection.toggle(1);

            expect(selection.isSelected(2)).toBeFalsy();
        });

        it('is true when selected', () => {
            selection.toggle(2);

            expect(selection.isSelected(2)).toBeTruthy();
        });
    });

    describe('toggle', () => {
        it('returns itself', () => {
            expect(selection.toggle(1)).toBe(selection);
        });

        describe('when nothing is selected', () => {
            it('will select the new value', () => {
                selection.toggle(2);

                expect(selection.isSelected(2)).toBeTruthy();
            });
        });

        describe('when another value is selected', () => {
            beforeEach(() => {
                selection.toggle(1);
            });

            it('will select the new value', () => {
                selection.toggle(2);

                expect(selection.isSelected(2)).toBeTruthy();
            });

            it('will deselect the previous value', () => {
                selection.toggle(2);

                expect(selection.isSelected(1)).toBeFalsy();
            });
        });

        describe('when new value is already selected', () => {
            beforeEach(() => {
                selection.toggle(1);
            });

            it('will deselect the value', () => {
                selection.toggle(1);

                expect(selection.isSelected(1)).toBeFalsy();
            });

            it('will not select any other value', () => {
                selection.toggle(1);

                expect(selection.hasSelection()).toBeFalsy();
            });
        });
    });

    describe('hasSelection', () => {
        it('is false by default', () => {
            expect(selection.hasSelection()).toBeFalsy();
        });

        it('is true after a selection', () => {
            selection.toggle(1);

            expect(selection.hasSelection()).toBeTruthy();
        });
    });

    describe('select', () => {
        it('returns itself', () => {
            expect(selection.select(1)).toBe(selection);
        });

        it('its value is reflected in getSelection', () => {
            selection.select(3);

            expect(selection.getSelection()).toEqual(3);
        });

        it('it results in a selection', () => {
            selection.select(3);

            expect(selection.hasSelection()).toBeTruthy();
        });
    });
});
