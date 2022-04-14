export class PLIndexSelectionService {
    private selection: number | null;

    constructor(selection: number | null = null) {
        this.selection = selection;
    }

    clear(): PLIndexSelectionService {
        this.select(null);

        return this;
    }

    toggle(index: number): PLIndexSelectionService {
        this.selection = (index === this.selection) ? null : index;

        return this;
    }

    hasSelection(): boolean {
        return this.selection != null;
    }

    getSelection(): number | null {
        return this.selection;
    }

    isSelected(index: number): boolean {
        return this.selection === index;
    }

    select(value: number): PLIndexSelectionService {
        this.selection = value;

        return this;
    }
}
