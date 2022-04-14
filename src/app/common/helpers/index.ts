// https://codegolf.stackexchange.com/questions/4707/outputting-ordinal-numbers-1st-2nd-3rd/119563#119563
export const getOrdinalNumber = (n: number) => {
    return `${n}${[, 'st', 'nd', 'rd'][n % 100 >> 3 ^ 1 && n % 10] || 'th'}`;
};

export const SET_STORAGE = (storageKey: string, content: any, minutesToExpire?: number) => {
    let expiration;
    if (minutesToExpire) {
        expiration = new Date();
        expiration.setTime(expiration.getTime() + minutesToExpire * 60000);
    }
    sessionStorage.setItem(storageKey, JSON.stringify({
        content,
        expiration,
    }));
};

export const GET_STORAGE = (storageKey: string) => {
    const storageString = sessionStorage.getItem(storageKey);
    if (!storageString) {
        return null;
    }
    const storage = JSON.parse(storageString);
    const expiration = new Date(storage.expiration);
    if (expiration) {
        const now = new Date();
        if (now.getTime() > expiration.getTime()) {
            sessionStorage.removeItem(storageKey);
            return null;
        }
    }
    return storage.content;
};

export const NORMALIZE_TEXT = (text: string) => {
    // Remove accents and apostrophes
    return text.normalize('NFD').replace(/[\u0300-\u036f-\u0027]/g, '');
};
