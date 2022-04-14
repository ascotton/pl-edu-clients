import { Component } from '@angular/core';

import { Modal1Component } from './modals/modal-1/modal-1.component';
import { Modal2Component } from './modals/modal-2/modal-2.component';
import {
    PLToastService,
    PLLinkService,
    PLModalService,
    PLConfirmDialogService,
} from '@root/index';

@Component({
    selector: 'other-demo',
    templateUrl: './other-demo.component.html',
    styleUrls: ['./other-demo.component.less'],
})
export class OtherDemoComponent {
    tabs: any = [
        { href: '/components/other/step-1', label: 'Step 1', replaceHistory: true },
        { href: '/components/other/step-2', label: 'Step 2', replaceHistory: true },
        { href: '/components/other/step-3', label: 'Step 3', replaceHistory: true },
        { href: '/components/icons', label: 'Icons' },
        { href: '/components/other', label: 'Other', replaceHistory: true },
    ];
    miniCalendarDate: string = '';
    miniCalendarDate2: string = '2016-07-14';
    steps: any[] = [
        {
            href: '/components/other/step-1',
            hrefQueryParams: { param1: '1' },
            label: 'Step One',
            replaceHistory: true,
        },
        {
            href: '/components/other/step-2',
            hrefQueryParams: { param1: '1' },
            label: 'Step Two',
            replaceHistory: true,
        },
        { href: '/components/other/step-3', label: 'Step Three', replaceHistory: true },
    ];

    backLink: string = '';
    isAnchoredDialogVisible = false;

    constructor(
        private plToast: PLToastService,
        private plLink: PLLinkService,
        private plConfirmService: PLConfirmDialogService,
        private plModal: PLModalService
    ) {}

    ngOnInit() {
        this.plLink.getBackState().subscribe((state: any) => {
            this.backLink = state.title;
        });
    }

    toast(type: string) {
        this.plToast.show(type, `${type} message here`);
    }

    closableClicked() {
        alert('Closable clicked!');
    }

    confirm(message: string) {
        this.plConfirmService.show({
            header: 'Hey you!',
            content: `<div style="color:red;font-weight:bold;">Wanna buy a <span style="color:green;text-decoration:underline;;">monkey</span>?</div>
                      <div style="font-size:48px;">🐵</div>`,
            primaryLabel: 'Coo',
            secondaryLabel: 'Nah man',
            primaryCallback: () => {
                console.log('Confirmed!');
            },
            secondaryCallback: () => {
                console.log('Canceled!');
            },
        });
    }

    dialogToast() {
        this.plConfirmService.show({
            type: 'toast',
            toastType: 'warning',
            content: `Reassigning this evaluation has billing implications. Make sure customer is notified. Do you want to continue?`,
            primaryLabel: 'Yes, I want to reassign',
            secondaryLabel: 'Cancel',
            primaryClasses: {
                primary: false,
            },
            secondaryClasses: {
                bare: true,
            },
            primaryCallback: () => {
                console.log('Reassigned!');
            },
            secondaryCallback: () => {
                console.log('Canceled!');
            },
        });
    }

    stepsCancel() {
        console.log('steps cancel');
        this.plLink.goBack();
    }

    stepsFinish() {
        console.log('steps finish');
    }

    showModal(componentName: string) {
        let modalRef: any;
        const params: any = {
            data: { key1: 'val1' },
            onCancel: () => {
                modalRef._component.destroy();
            },
        };
        let component: any = undefined;
        switch (componentName) {
            case 'modal-1':
                component = Modal1Component;
                params.headerText = 'Modal 1';
                params.onSave = (saveData: any) => {
                    console.log('modal-1 onSave', saveData);
                };
                break;

            case 'modal-2':
                component = Modal2Component;
                break;
        }

        // this.plModal.create(AppModule, component, params).subscribe((ref: any) => {
        this.plModal.create(component, params).subscribe((ref: any) => {
            modalRef = ref;
        });

        /*
    if (componentName === "modal-1") {
      params.headerText = "Modal 1";
      params.onSave = (saveData: any) => {
        console.log("modal-1 onSave", saveData);
      };
      this.plModal
        .create(AppModule, Modal1Component, params)
        .subscribe((ref: any) => {
          modalRef = ref;
        });
    } else if (componentName === "modal-2") {
      this.plModal
        .create(AppModule, Modal2Component, params)
        .subscribe((ref: any) => {
          modalRef = ref;
        });
    }
*/

    }

    showAnchoredDialog(): void {
        this.isAnchoredDialogVisible = true;
    }

    onAnchoredDialogClose(): void {
        this.isAnchoredDialogVisible = false;
    }
}
