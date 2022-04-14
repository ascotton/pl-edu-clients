import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fadeInOnEnterAnimation } from 'angular-animations';

@Component({
    selector: 'pl-gallery-modal',
    templateUrl: './pl-gallery-modal.component.html',
    styleUrls: ['./pl-gallery-modal.component.less'],
    animations: [
        fadeInOnEnterAnimation({ anchor: 'animateIn', duration: 1000 }),
    ],
})
export class PLGalleryModalComponent implements OnInit {
    carouselImageScale = 1;
    zoomScaleStep = 0.1;
    carouselImages: any[] = [];
    currentIndex = 0;
    galleryTitle = '';

    constructor(
        private dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public modalInput: { images: any, title: string },
    ) { }

    get scaleXY() {
        return `scale(${this.carouselImageScale})`;
    }

    ngOnInit(): void {
        const { images, title } = this.modalInput;
        this.galleryTitle = title;
        this.carouselImages = images;
        this.currentIndex = 0;
    }

    onClickCloseButton() {
        this.dialog.closeAll();
    }

    onClickZoomIn() {
        this.carouselImageScale += this.zoomScaleStep;
    }

    onClickZoomOut() {
        this.carouselImageScale -= this.zoomScaleStep;
    }

    onClickNext() {
        const nextIndex = this.currentIndex + 1;
        if (nextIndex === this.carouselImages.length) {
            this.onChangeCurrentIndex(0);
            return;
        }
        this.onChangeCurrentIndex(nextIndex);
    }

    onClickPrev() {
        const prevIndex = this.currentIndex - 1;
        if (prevIndex < 0) {
            this.onChangeCurrentIndex(this.carouselImages.length - 1);
            return;
        }
        this.onChangeCurrentIndex(prevIndex);
    }

    onChangeCurrentIndex(index: number) {
        this.currentIndex = index;
        this.carouselImageScale = 1;
    }
}
