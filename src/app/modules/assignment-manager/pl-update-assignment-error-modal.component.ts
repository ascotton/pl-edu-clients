import { Component, Input, OnInit } from '@angular/core';
import { PLModalService } from '@root/index';

@Component({
  selector: 'pl-update-assignment-error-modal',
  templateUrl: './pl-update-assignment-error-modal.component.html',
})
export class PLUpdateAssignmentErrorModalComponent implements OnInit {
  @Input() saveErrors: any[];
  formattedErrors: any[];

  constructor(private plModalSvc: PLModalService) { }

  ngOnInit() {
    let errors: any[] = [];
    for (const code in this.saveErrors) {
      errors.push({ code: code, text: this.saveErrors[code] });
    }
    this.formattedErrors = errors;
  }

  onClickBack() {
    this.plModalSvc.destroyAll();
  }

}
