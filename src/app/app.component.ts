import { ChangeDetectorRef, Component, Renderer2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRouteSnapshot, NavigationEnd } from '@angular/router';
// RxJS
import { Store } from '@ngrx/store';
import { first, takeUntil } from 'rxjs/operators';

import { NgProgress, NgProgressRef } from 'ngx-progressbar';
// Common
import { PLNavigationLoaderService, PLDesignService } from '@common/services';

import { AppConfigService } from './app-config.service';
import { AppStore } from './appstore.model';
import { User } from './modules/user/user.model';
import { InactivityLogoutService } from './modules/user/inactivity-logout.service';
import { PLInactiveService } from './modules/user/pl-inactive/pl-inactive.service';

import {
    PLAssumeLoginService,
    PLBrowserService,
    HeapLogger,
    PLUrlsService,
    PLMayService,
    PLClientStudentDisplayService,
}
    from '@root/index';

// Animations
import { fadeAnimation } from './animations';

import {
    PLUtilService, PLComponentStateInterface, PLMessageStream, PLEventMessageBus, PLEventStream,
    PLEventContext, PLEventMessage, PLTasksService,
}
    from '@common/services/';

import { ROUTING } from './common/constants';
import { environment } from '@environments/environment';
import { PLDestroyComponent } from './common/components';
import { PLMatomoService } from './common/services/pl-matomo.service';

@Component({
    // tslint:disable-next-line: component-selector
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
    animations: [
        fadeAnimation,
    ],
})
export class AppComponent extends PLDestroyComponent {
    _state: PLComponentStateInterface;
    componentName = 'AppComponent';
    private appGlobalStream: PLMessageStream;

    currentUser: User;
    gitSha = '';
    pageLinks: any[] = [];
    appLinks: any[] = [];
    supportLinks: any[] = [];
    userMenuLinks: any[] = [];
    isAssumedLogin = false;
    logo: any = {};
    browserSupported = true;
    classContainer = '';
    loggedIn = false;
    private userGlobalPermissions: any = {};
    appConfig: any;
    private loadingBar: NgProgressRef;
    private checkChangesTimeout: any;
    changeDetectCount = 0;

    fullWidth = false;
    // #region Search
    allowSearch = false;
    showSearch = false;
    // #endregion
    hasTasks = false;
    hasUnreadTasks = false;
    newDesign: boolean;

    constructor(
        loadingBarService: NgProgress,
        public util: PLUtilService,
        private messageBus: PLEventMessageBus,
        private sanitizer: DomSanitizer,
        private store: Store<AppStore>, private router: Router,
        private plBrowser: PLBrowserService, private heapLogger: HeapLogger,
        private plMay: PLMayService, private plUrls: PLUrlsService, appConfig1: AppConfigService,
        private inactivityLogoutService: InactivityLogoutService,
        private renderer: Renderer2, private assumeLoginService: PLAssumeLoginService,
        private navigationLoader: PLNavigationLoaderService,
        private plInactive: PLInactiveService,
        private plTasksService: PLTasksService,
        public plDesign: PLDesignService,
        private cdr: ChangeDetectorRef,
        plMatomo: PLMatomoService,
    ) {
        super();
        plMatomo.init();
        this.appConfig = appConfig1;
        this.loadingBar = loadingBarService.ref('navProgress');
        navigationLoader.fullData(true)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(({ fullWidth }) => {
                this.fullWidth = !!fullWidth;
            });
        this.navigationLoader.isNavigationPending$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((loading) => {
                loading ? this.loadingBar.start() : this.loadingBar.complete();
            });
    }

    ngOnInit() {
        this.plDesign.enabled$
            .pipe(takeUntil(this.destroyed$))
            .subscribe(enabled => this.newDesign = enabled);

        // We want to block an inactive logout if the page was reloaded.
        this.plInactive.clearLastActiveDatetime();
        this._state = this.util.initComponent({
            name: this.componentName,
            params: {
                flags: {
                    DEBUG_HILITE: 1,
                },
            },
            fn: (state, done) => {
                state.asyncCount = 1;

                state.environment = environment;
                this.currentUser = state.currentUser;
                this.loggedIn = (this.currentUser && this.currentUser.uuid) ? true : false;
                this.sanitizer = this.sanitizer;
                this.inactivityLogoutService.renderer = this.renderer;
                this.gitSha = state.gitSha = environment.git_sha ? environment.git_sha.slice(0, 4) : '';
                this.util.hiliteLog(
                    `\n--  app sha: ${this.gitSha}\n-- auth ctx: ${this.getEnvironmentContext()}`,
                    '',
                    state,
                );

                this.formLinks();
                this.heapLogger.setUser(this.currentUser);
                if (this.loggedIn) {
                    this.inactivityLogoutService.start();
                }

                // providers and customer admins have access to IEPs
                const hasIepAccess =
                    this.plMay.isProvider(this.currentUser) || this.plMay.isCustomerAdmin(this.currentUser);
                this.allowSearch = this.plMay.canGlobalSearch(this.currentUser);

                // change default client profile route for non-IEP-accessors
                if (!this.loggedIn || !hasIepAccess) {
                    const profileRoute = this.router.config.find((item: any) => item.path === 'client/:id');
                    const defaultRoute: any =
                        profileRoute && profileRoute.children.find((item: any) => item.path === '');
                    if (defaultRoute) defaultRoute.redirectTo = 'services';
                }

                this.assumeLoginService.getAssumedLogin.subscribe((isAssumedLogin: boolean) => {
                    this.isAssumedLogin = isAssumedLogin;
                    this.heapLogger.setIsHijacked(isAssumedLogin);
                });

                // Console access for developers who use login hijack
                window['plHijackUtil'] = {
                    hideHijack: (toggle: boolean = true) => {
                        this.assumeLoginService.setHideAssumedLogin(toggle);
                    },
                };

                this.browserSupported = this.plBrowser.isSupported();

                this.initPageTitleLogic();

                this.logo.href = this.plUrls.urls.homeFE;
                this.formLinks();

                this.store.select('app').pipe(first()).subscribe((app) => {
                    this.classContainer = app.classContainer;
                    this.setDebugBarInfo(state);
                    this.registerStreams(state);
                    done();
                });

                if (this.userGlobalPermissions.provideServices) {
                    this.plTasksService.getHasIncompleteTasks().subscribe((res: any) => {
                        this.hasTasks = res.hasTasks;
                        this.hasUnreadTasks = res.hasUnreadTasks;
                    });
                    this.plTasksService.start();
                }
            },
        });
    }

    formLinks() {
        this.userGlobalPermissions = (this.currentUser && this.currentUser.xGlobalPermissions) ?
            this.currentUser.xGlobalPermissions : {};
        this.formPageLinks();
        this.formAppLinks();
        this.formSupportLinks();
        this.formUserMenuLinks();
    }

    setDebugBarInfo(state: PLComponentStateInterface) {
        const u = state.currentUser;
        const groups = u.groups.join(',');
        const provider = u.xProvider;
        state.debugBarInfo = {
            groups,
            username: u.username,
            firstName: u.first_name,
            lastName: u.last_name,
            extra: undefined,
        };
        if (provider && provider.providerTypeCode) {
            state.debugBarInfo.providerType = provider.providerTypeCode.toUpperCase();
        }
    }

    showDebugBar() {
        return this.util.flagLocalStorage('DEBUG_BAR');
    }

    hideDebugBar() {
        localStorage.removeItem('DEBUG_BAR');
    }

    toggleDebugBar() {
        this._state.fullDebugBar = !this._state.fullDebugBar;
        this.util.debugLog('clicked debug bar', '', this._state);
    }

    // http://stackoverflow.com/a/40468212
    private getDeepestTitle(routeSnapshot: ActivatedRouteSnapshot) {
        let title = (routeSnapshot.data && routeSnapshot.data['title']) ? routeSnapshot.data['title'] : '';

        if (routeSnapshot.firstChild) title = this.getDeepestTitle(routeSnapshot.firstChild) || title;

        return title;
    }

    private isSchoolStaffProvider(user: User) {
        return user && user.groups && user.groups.some((g: any) => g.indexOf('School Staff Providers') > -1);
    }

    private isTherapist(user: User) {
        return user && user.groups && user.groups.some((g: any) => g.indexOf('Therapist') > -1);
    }

    private isPrivatePracticeProvider(user: User) {
        return user && user.groups && user.groups.some((g: any) => g.indexOf('Private Practice') > -1);
    }

    private isClientContact(user: User) {
        return user && user.groups && user.groups.some((g: any) => g.indexOf('Client Contact') > -1);
    }

    formPageLinks() {
        // ssp's and private practice get only home
        if (this.isSchoolStaffProvider(this.currentUser) || this.isPrivatePracticeProvider(this.currentUser)) {
            this.pageLinks = [
                { href: '/landing-home', label: 'Home', icon: 'home' },
            ];
            return;
        }

        // client contacts get nothing
        if (this.isClientContact(this.currentUser)) {
            this.pageLinks = [];
            return;
        }

        const clientStudentText = PLClientStudentDisplayService.get(this.currentUser, { capitalize: true });
        let links: any[] = [
            { href: '/client', label: `${clientStudentText}s`, icon: 'clients' },
        ];
        if (this.loggedIn) {
            const hasPermissions =
                this.userGlobalPermissions.manageReferrals || this.userGlobalPermissions.viewOpenReferrals;

            // Referrals link not allowed for Customer group
            if (hasPermissions) {
                links = [
                    ...links,
                    { href: '/client-referrals', label: 'Referrals', icon: 'referrals' },
                ];
            }
        }

        if (this.userGlobalPermissions.viewProviders && (this.plMay.isAdminType(this.currentUser) ||
            this.plMay.isSuperuser(this.currentUser))) {
            links = [
                ...links,
                { href: '/providers', label: 'Providers', icon: 'providers' },
            ];
        }
        links = [
            ...links,
            { href: '/location', label: 'Locations', icon: 'location' },
        ];

        if (this.loggedIn && this.userGlobalPermissions.provideServices) {
            const isSSP = this.isSchoolStaffProvider(this.currentUser);
            // const viewSchedule = !!this.currentUser.xPermissions.viewSchedule;
            if (this.userGlobalPermissions.provideServices && !isSSP) {
                // ssp's get no schedule
                links = [
                    ...links,
                    { href: '/schedule', label: 'Schedule', icon: 'schedule' },
                ];
            }
            links = [
                ...links,
                { href: '/billing', label: 'Billing', icon: 'billing' },
            ];
        }

        if (this.userGlobalPermissions.viewCustomers) {
            links = [
                ...links,
                { href: '/users', label: 'Users', icon: 'user' },
            ];
        }
        this.pageLinks = links;
    }

    formAppLinks() {
        let links: any = [];
        if (this.loggedIn) {
            const isSSP = this.isSchoolStaffProvider(this.currentUser);
            const isTherapist = this.isTherapist(this.currentUser);
            const isPrivatePratice = this.isPrivatePracticeProvider(this.currentUser);
            if (this.userGlobalPermissions.provideServices || isSSP || isTherapist || isPrivatePratice) {
                links = [
                    ...links,
                    { hrefAbsolute: this.plUrls.urls.roomFE, label: 'Room', icon: 'room' },
                    { hrefAbsolute: this.plUrls.urls.libraryFE, label: 'Library', icon: 'library' },
                ];
            }
        }
        this.appLinks = links;
    }

    formSupportLinks() {
        const links: any = [];
        if (this.loggedIn) {
            links.push({ hrefAbsolute: this.plUrls.urls.techcheckFE, label: 'Computer Setup', icon: 'computer' });
            links.push({ href: '/logout', label: 'Sign Out  ', icon: 'signout' });
        }
        this.supportLinks = links;
    }

    formUserMenuLinks() {
        const sanitizedVoidUrl = this.sanitizer.bypassSecurityTrustUrl('javascript:void(0);');
        const links: any = [];
        links.push({ hrefAbsolute: this.plUrls.urls.landing, label: 'Home', icon: 'home' });
        links.push({ hrefAbsolute: this.plUrls.urls.techcheckFE, label: 'Computer Setup', icon: 'computer' });
        links.push({
            hrefAbsolute: sanitizedVoidUrl,
            label: 'Support Chat',
            icon: 'chat',
            click: this.onClickSupportChat,
        });

        if (this.userGlobalPermissions.provideServices || this.plMay.isAdminType(this.currentUser)) {
            links.push({
                hrefAbsolute: this.plUrls.urls.helpDocsFE,
                label: 'Help Center',
                icon: 'help',
                target: '_blank',
            });
        }
        if (!this.userGlobalPermissions.provideServices) {
            links.push({ hrefAbsolute: this.plUrls.urls.trainingFaqFE, label: 'Training & FAQ', icon: 'help', target: '_blank' });
        }
        links.push({ hrefAbsolute: this.plUrls.urls.changePasswordFE, label: 'Change Password', icon: 'key' });
        links.push({
            hrefAbsolute: this.plUrls.urls.copyrightFE,
            label: 'Copyright Policy',
            icon: 'copyright-policy',
            target: '_blank',
        });
        links.push({
            hrefAbsolute: this.plUrls.urls.codeOfConductFE,
            label: 'Code of Conduct',
            icon: 'code-conduct',
            target: '_blank',
        });
        links.push({ href: '/logout', label: 'Sign Out', icon: 'signout' });
        links.push({ hrefAbsolute: sanitizedVoidUrl, label: `Version: ${this.gitSha}`, icon: 'version', class: 'menu-item-no-link' });

        this.userMenuLinks = links;
    }

    onClickSupportChat() {
        const _timeout = window['setTimeout'];
        const liveagent = window['liveagent'];
        const plLiveAgent = window['plLiveAgent'];
        const buttonId = '57380000000GnQ2';
        if (plLiveAgent) {
            console.log(`[plLiveAgent]`, plLiveAgent);
        }
        if (liveagent && plLiveAgent && plLiveAgent.chatAvailable) {
            liveagent.startChat(plLiveAgent.buttonId);
        }
    }

    onClickLogout(event: any) {
        event.cancelBubble = true;
        event.stopPropagation();
        this.router.navigate(['logout']);
        return false;
    }

    hidePageLinks() {
        const url = this.router.url;
        const urlParts = ['/provider-onboarding'];
        for (let ii = 0; ii < urlParts.length; ii++) {
            if (url.includes(urlParts[ii])) {
                return true;
            }
        }
        return false;
    }

    hideAppLinks() {
        const url = this.router.url;
        const urlParts = ['/provider-onboarding'];
        for (let ii = 0; ii < urlParts.length; ii++) {
            if (url.includes(urlParts[ii])) {
                return true;
            }
        }
        return false;
    }

    get currentUsername() {
        return (this.currentUser && this.currentUser.username) || '';
    }

    // #region Privates

    private getEnvironmentContext() {
        const authUrl = environment.apps.auth.url;
        return authUrl.split('//')[1];
    }

    /***
     * Inits the logic for setting the page titles in the app
     * Handles two scenarios:
     *   when the app just starts and the call of a subscriber that will be hearing the `router.events`.
     */
     private initPageTitleLogic() {
        this.plBrowser.setTitleSuffix('PresenceLearning');
        let title = this.getDeepestTitle(this.router.routerState.snapshot.root);
        if (title && title !== ROUTING.DYNAMIC) this.plBrowser.setTitle(title); // Helps when the page is reloaded.
        this.setTitleBasedOnRouterEvent(); // will be hearing the `router.events`
    }

    private registerStreams(state: PLComponentStateInterface) {
        this.appGlobalStream = this.messageBus.initStream(PLEventStream.APP_GLOBAL_STREAM, state);
        this.appGlobalStream.onReceive(PLEventContext.APP_DEBUG_BAR, (message: PLEventMessage) => {
            this._state.debubBarInfo.extra = message.data;
        });
    }

    /**
     * Sets the title of the page based on the router event.
     * But in the scenario of a `ROUTING.DYNAMIC`:
     *   -> the `title` won't be set.
     *   -> since the `pl-tabs` component sets the title of the page along with the `pl-link`.
     *   -> `ROUTING.DYNAMIC` means there's dynamic sub navigation in the page.
     */
    private setTitleBasedOnRouterEvent() {
        this.router.events.subscribe((event) => {
            let title: string = null;
            if (event instanceof NavigationEnd) title = this.getDeepestTitle(this.router.routerState.snapshot.root);
            if (title && title !== ROUTING.DYNAMIC) this.plBrowser.setTitle(title);
        });
    }

    // #endregion Privates
}