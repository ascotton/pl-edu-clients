export namespace PLClientIdService {

    export function getModeFromId(id: string) {
        if (!id) {
            return 'empty';
        }
        const badIdPrefixes = ['legacy-migration-'];
        let mode: string = 'normal';
        let atLeastOne = badIdPrefixes.some((prefix: any) => {
            return id.startsWith(prefix)
        });
        if (atLeastOne) {
            mode = 'needs_update';
        }
        return mode;
    }

}