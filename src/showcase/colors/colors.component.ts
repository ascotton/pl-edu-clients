import { Component, ElementRef } from '@angular/core';
import { PLLodashService } from '@root/index';

@Component({
    selector: 'colors',
    templateUrl: './colors.component.html',
    styleUrls: ['./colors.component.less'],
})
export class ColorsComponent {
    colorGroups: Array<{}> = [];

    constructor(private _ref: ElementRef, private plLodash: PLLodashService) {
        let colors = this.processColorLESS();
        this.colorGroups = this.groupColors(colors);
    }

    processColorLESS() {
        let lines = colorLESS.split('\n').filter(item => item != '').map(item => item.substring(1, item.length - 1));
        let colors: Array<{}> = [];
        for (let line of lines) {
            let parts = line.split(':');
            colors.push({
                name: parts[0].trim(),
                value: parts[1].trim(),
            });
        }
        return colors;
    }

    groupColors(colors: Array<{}>) {
        let colorGroups = {};
        for (let color of colors) {
            let groupName = color['name'].split('-')[0];
            if (!colorGroups.hasOwnProperty(groupName)) {
                colorGroups[groupName] = [];
            }
            colorGroups[groupName].push(color);
        }
        // return Object.values(colorGroups);
        return this.plLodash.objectValues(colorGroups);
    }

    copyToClipboard() {
        var colorSelection = this._ref.nativeElement.querySelector('.colorValue');

        // first clear the selections
        window.getSelection().removeAllRanges();

        // now select the value
        var range = document.createRange();
        range.selectNode(colorSelection);
        window.getSelection().addRange(range);

        try {
            // Now that we've selected the anchor text, execute the copy command
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
            console.log('Copy command was ' + msg);
        } catch (err) {
            console.log('Oops, unable to copy');
        }
        // Remove the selections - NOTE: Should use
        // removeRange(range) when it is supported
        window.getSelection().removeAllRanges();
    }
}

// This is copied directly from colors.less, if colors.less changes, this should be updated too.
let colorLESS = `
@orange: #ed8000;
@orange-dark: #F26724;

@blue: #4d8bbe;
@blue-medium: #46b1e1;
@blue-light: #85D4F8;
@blue-lighter: #B6E6FB;
@blue-lightest: #e5f6fe;

@gray: #b6b8ba;
@gray-darkest: #4c4f52;
@gray-darker: #747678;
@gray-dark: #8f9194;
@gray-light: #d2d3d5;
@gray-lighter: #e6e6e6;
@gray-lightest: #edeeef;
@gray-really-light: #fbfbfb;

@slate: #647f94;
@slate-darkest: #2d3a45;
@slate-darker: #465460;
@slate-dark: #556879;
@slate-medium: #95aabb;
@slate-light: #d7e2ea;
@slate-lighter: #e8eef2;
@slate-lightest: #f8f9fa;

@green: #78a240;
@green-medium: #9ac61e;
@green-light: #EBF6CC;

@red: #D0021B;
@red-light: #FEE2E2;

@yellow: #f9b417;
@yellow-light: #FDEBC1;
@yellow-dark: #F0B643;

@purple: #b665a6;

@cream: #F8F3E0;

@black: #000000;
@white: #FFFFFF;
`;
