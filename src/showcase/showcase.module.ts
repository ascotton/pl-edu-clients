import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';

import { Modal1Module } from './other/modals/modal-1/';
import { Modal2Module } from './other/modals/modal-2/';

import { ShowcaseComponent } from './showcase.component';

// Components
import {
    PLAppNavModule,
    PLButtonModule,
    PLBrowserModule,
    PLConfigModule,
    PLDotLoaderModule,
    PLGraphQLModule,
    PLInputModule,
    PLIconModule,
    PLLinkModule,
    PipeModule,
    PLModalModule,
    PLStepsModule,
    PLTableModule,
    PLTableFrameworkModule,
    PLTabsModule,
    PLToastModule,
    PLDialogModule,
    PLClosablePageHeaderModule,
    PLProgressModule,
    PLHttpModule,
    PLCarouselModule,
    PLProfileHeaderModule,
    PLLiveagentModule,
    // Services
    PLFormatterService,
    PLBrowserService,
    PLLodashService,
} from '../../index';
// Components
import { TypographyComponent } from './typography/typography.component';
import { ButtonsComponent } from './buttons/buttons.component';
import { CarouselComponent } from './carousel/carousel.component';
import { ColorsComponent } from './colors/colors.component';
import { ConfigComponent } from './config/config.component';
import { DecorationComponent } from './decoration/decoration.component';
import { PLIconsDemoComponent } from './icons/pl-icons-demo.component';
import { TableDemoComponent } from './table/table-demo.component';
import { TableFrameworkDemoComponent } from './table-framework/table-framework-demo.component';
import { OtherDemoComponent } from './other/other-demo.component';
import { Step1Component } from './other/steps/step-1/step-1.component';
import { Step2Component } from './other/steps/step-2/step-2.component';
import { Step3Component } from './other/steps/step-3/step-3.component';
import { Modal1Component } from './other/modals/modal-1/modal-1.component';
import { Modal2Component } from './other/modals/modal-2/modal-2.component';
import { InputsDemoComponent } from './inputs/inputs-demo.component';
import { ProfileDemoComponent } from './profile/profile-demo.component';
// Routing
import { PLShowcaseRoutingModule } from './showcase-routing.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        Modal1Module,
        Modal2Module,
        // Components
        PLAppNavModule,
        PLButtonModule,
        PLCarouselModule,
        PLBrowserModule,
        PLClosablePageHeaderModule,
        PLConfigModule,
        PLDotLoaderModule,
        PLIconModule,
        PLInputModule,
        PLModalModule,
        PLProgressModule,
        PLStepsModule,
        PLTableModule,
        PLTableFrameworkModule,
        PLTabsModule,
        PLToastModule,
        PLDialogModule,
        PLProfileHeaderModule,
        PLLinkModule,
        PLLiveagentModule,
        // Services
        PLHttpModule,
        PipeModule,
        PLShowcaseRoutingModule,
    ],
    declarations: [
        ShowcaseComponent,
        ButtonsComponent,
        CarouselComponent,
        ColorsComponent,
        ConfigComponent,
        DecorationComponent,
        PLIconsDemoComponent,
        InputsDemoComponent,
        OtherDemoComponent,
        Step1Component,
        Step2Component,
        Step3Component,
        TableDemoComponent,
        TableFrameworkDemoComponent,
        TypographyComponent,
        ProfileDemoComponent,
    ],
    entryComponents: [
        Modal1Component,
        Modal2Component,
    ],
    providers: [
        PLBrowserService,
        PLFormatterService,
        PLLodashService,
    ],
})
export class PLShowcaseModule {}
