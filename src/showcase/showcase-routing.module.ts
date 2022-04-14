import { NgModule }     from '@angular/core';
import { RouterModule } from '@angular/router';
// Components
import { TypographyComponent } from './typography/typography.component';
import { ColorsComponent } from './colors/colors.component';
import { ConfigComponent } from './config/config.component';
import { ButtonsComponent } from './buttons/buttons.component';
import { CarouselComponent } from './carousel/carousel.component';
import { DecorationComponent } from './decoration/decoration.component';
import { PLIconsDemoComponent } from './icons/pl-icons-demo.component';
import { InputsDemoComponent } from './inputs/inputs-demo.component';
import { TableDemoComponent } from './table/table-demo.component';
import { TableFrameworkDemoComponent } from './table-framework/table-framework-demo.component';
import { ProfileDemoComponent } from './profile/profile-demo.component';
import { OtherDemoComponent } from './other/other-demo.component';
import { Step1Component } from './other/steps/step-1/step-1.component';
import { Step2Component } from './other/steps/step-2/step-2.component';
import { Step3Component } from './other/steps/step-3/step-3.component';
import { ShowcaseComponent } from './showcase.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: ShowcaseComponent,
                children: [
                    {
                        path: 'typography',
                        component: TypographyComponent,
                        data: { title: 'Typography' },
                    },
                    {
                        path: 'colors',
                        component: ColorsComponent,
                        data: { title: 'Colors' },
                    },
                    {
                        path: 'config',
                        component: ConfigComponent,
                        data: { title: 'Config' },
                    },
                    {
                        path: 'buttons',
                        component: ButtonsComponent,
                        data: { title: 'Buttons' },
                    },
                    {
                        path: 'carousel',
                        component: CarouselComponent,
                        data: { title: 'Carousel' },
                    },
                    {
                        path: 'decoration',
                        component: DecorationComponent,
                        data: { title: 'Decoration' },
                    },
                    {
                        path: 'icons',
                        component: PLIconsDemoComponent,
                        data: { title: 'Icons' },
                    },
                    {
                        path: 'inputs',
                        component: InputsDemoComponent,
                        data: { title: 'Inputs' },
                    },
                    {
                        path: 'tables',
                        component: TableDemoComponent,
                        data: { title: 'Tables' },
                    },
                    {
                        path: 'table-framework',
                        component: TableFrameworkDemoComponent,
                        data: { title: 'Table Framework' },
                    },
                    {
                        path: 'profile',
                        component: ProfileDemoComponent,
                        data: { title: 'Profile' },
                    },
                    {
                        path: 'other',
                        component: OtherDemoComponent,
                        data: { title: 'Other' },
                        children: [
                            { path: '', redirectTo: 'step-1', pathMatch: 'full' },
                            {
                                path: 'step-1',
                                component: Step1Component,
                                data: { title: 'Other - Step 1' },
                            },
                            {
                                path: 'step-2',
                                component: Step2Component,
                                data: { title: 'Other - Step 2' },
                            },
                            {
                                path: 'step-3',
                                component: Step3Component,
                                data: { title: 'Other - Step 3' },
                            },
                        ],
                    },
                ],
            },
        ])
    ],
    exports: [RouterModule],
})
export class PLShowcaseRoutingModule {}
