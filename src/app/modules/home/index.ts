import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PLHomeComponent } from "./pl-home/pl-home.component";

@NgModule({
  imports: [CommonModule, RouterModule],
  exports: [PLHomeComponent],
  declarations: [PLHomeComponent],
  providers: [],
})
export class PLHomeModule { }
