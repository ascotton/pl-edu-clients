import { User } from './modules/user/user.model';

export interface Client {
    id: string;
}
export interface ClientsList {
    count: number;
}
export interface BackLink {
    previousState: any;
}
export interface App {
    classContainer: string;
}

export interface AppStore {
    currentUser: User;
    currentClient: Client;
    currentClientUser: any;
    clientsList: ClientsList;
    backLink: BackLink;
    app: App;
    notesReportDownloads: any;
    providerOnboardingStore: any;
}
