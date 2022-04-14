import { Component } from '@angular/core';

@Component({
    selector: 'carousel',
    templateUrl: './carousel.component.html',
    styleUrls: ['./carousel.component.less'],
})
export class CarouselComponent {
    items: any[] = [];

    constructor() {
    }

    ngOnInit() {
        this.formItems();
    }

    formItems(count = 25) {
        const items: any[] = [];
        for (let ii = 0; ii < count; ii++) {
            items.push({
                title: ii.toString(),
            });
        }
        this.items = items;
    }
}
