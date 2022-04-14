import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
    name: 'safeurl',
})
export class PLSafeurlPipe implements PipeTransform {

    constructor(private domSanitizer: DomSanitizer) {}

    transform(value: any) {
        return this.domSanitizer.bypassSecurityTrustUrl(value);
    }
}
