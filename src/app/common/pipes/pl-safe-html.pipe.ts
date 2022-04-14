import { PipeTransform, Pipe } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
    name: 'plSafeHtml',
})
export class PLSafeHtmlPipe implements PipeTransform {

    constructor(private sanitized: DomSanitizer) {}

    transform(rawHtml: string) {
        return this.sanitized.bypassSecurityTrustHtml(rawHtml);
    }
}
