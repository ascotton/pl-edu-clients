import {
    Input,
    OnChanges,
    Component,
    HostBinding,
    SimpleChanges,
    ChangeDetectionStrategy,
  } from '@angular/core';
import { PLStylesService } from '@root/index';

interface PLLegend {
    label: string;
    color?: string;
}

@Component({
    selector: 'pl-legends',
    templateUrl: './pl-legends.component.html',
    styleUrls: ['./pl-legends.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PLLegendsComponent implements OnChanges {

    @Input() label = 'KEY:';
    @Input() legends: PLLegend[];
    @Input() @HostBinding('class.vertical') vertical: boolean;
    labels: PLLegend[];

    constructor(private plStyles: PLStylesService) { }

    ngOnChanges(changes: SimpleChanges) {
        const { legends } = changes;
        if (legends) {
            // Do mapping in order to get branded colors
            this.labels = this.legends
                .map(l => ({ ...l, color: this.getColor(l.color) }));
        }
    }

    // TODO: Should it be move to a service?
    private getColor(color: string) {
        const _color = this.plStyles.getColorForName(color);
        return _color ? `#${_color}` : color;
    }
}
