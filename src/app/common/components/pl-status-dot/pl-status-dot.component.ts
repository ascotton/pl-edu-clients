import { Component, Input } from '@angular/core';
import { PLStatusDisplayService } from '@common/services/';

@Component({
    selector: 'pl-status-dot',
    templateUrl: './pl-status-dot.component.html',
    styleUrls: ['./pl-status-dot.component.less'],
})
export class PLStatusDotComponent {
    shape: string = null;
    @Input() status: string;

    constructor(private plStatusDisplayService: PLStatusDisplayService) {}

    ngOnChanges(changes: any) {
        this.shape = this.plStatusDisplayService.getShapeForStatus(this.status);
    }
    
    ngOnInit() {
        if (this.status) {
            this.shape = this.plStatusDisplayService.getShapeForStatus(this.status);
        }
    }


}
