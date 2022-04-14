import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
// RxJs
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { PLDesignService } from '../services';

@Injectable()
export class PLMaterialDesignResolver implements Resolve<boolean> {

    constructor(public plDesign: PLDesignService) {}

    resolve(): Observable<boolean> {
        // TODO: Should be condition to enable? Not for now
        this.plDesign.enable();
        return this.plDesign.enabled$.pipe(first());
    }
}
