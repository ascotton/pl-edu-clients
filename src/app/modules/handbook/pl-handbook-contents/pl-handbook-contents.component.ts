import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';
import { PLUrlsService, PLHttpService } from '@root/index';
import { Handbook } from '../handbook.model';

@Component({
    selector: 'pl-handbook-contents',
    templateUrl: './pl-handbook-contents.component.html',
    styleUrls: ['./pl-handbook-contents.component.less'],
})
export class PLHandbookContentsComponent {
    @Input() handbookInfo: Handbook;
    @Output() readonly contentsEvent = new EventEmitter<any>();
    @ViewChild('plHandbookContents') private contentsElementRef: ElementRef;

    contents: any[];

    private contentsElemRef: ElementRef;
    private contentsElemRefLength = 0;

    private CONTENTS_DESC = {
        summary: {
            description: 'Describe the area, children, and services',
        },
        iep_access: {
            description: 'Person to contact for access, training info if required',
        },
        iep_procedures: {
            description: 'Dates, forms, and definitions/terminology for IEPs',
        },
        eval_procedures: {
            description: 'Dates, forms, and definitions/terminology for evaluations',
        },
        clinical_notes: {
            description: 'Terminology, do\'s, dont\'s, and due dates for services',
        },
        make_up_policies: {
            description: 'What needs to be made up, by when, and how to document',
        },
        extended_school_year: {
            description: 'If applicable, provide ESY info for this organization',
        },
        additional_content: {
            description: 'Extra info that is helpful for guiding service & evaluation delivery',
        },
        pl_staff_internal: {
            description: 'Internal notes for PresenceLearning staff only; not visible to providers or schools',
        },
    };
    private PL_TD_CLASS = 'pl-toc-content';

    constructor(private plUrlsSvc: PLUrlsService, private plHttpSvc: PLHttpService) { }

    ngOnChanges() {
        if (this.handbookInfo && this.handbookInfo.orgId && this.handbookInfo.schoolYearId) {
            this.getContents();
        }
    }

    /**
     * Loads content info through events emitted.
     * Emits content twice (for the user not to feel latency in the displaying of the info due to API comunnication):
     *   First time for displaying Name and Description right away.
     *   Second time for sharing Text, Modification Dates, and any other info from API needed.
     */
    loadContent(contentToLoad: any, contentNumber: number) {
        if (contentToLoad && contentToLoad.section_type && contentToLoad.section_type.name) {
            const madeContent = {};
            const params = {
                school_year: this.handbookInfo.schoolYearId,
                section_type: contentToLoad.section_type.uuid,
            };
            const contentCode = contentToLoad.section_type.code;
            const url = `${this.plUrlsSvc.urls.handbookSection}${this.handbookInfo.orgId}/`;

            this.orderContentProperties(madeContent, contentCode, contentNumber, contentToLoad.section_type.name);
            this.emitContentThroughEvent(madeContent);
            this.setActiveStateOnContentSection(contentToLoad.section_type.name);

            this.plHttpSvc.get('', params, url).subscribe((response: any) => {
                this.orderContentProperties(response, contentCode, contentNumber);
                this.emitContentThroughEvent(response);
            });
        }
    }

    //#region Private Functions

    private emitContentThroughEvent(content: any) {
        this.contentsEvent.emit(content);
    }

    private getContents() {
        const params = {
            school_year: this.handbookInfo.schoolYearId,
        };
        const url = `${this.plUrlsSvc.urls.handbookSection}${this.handbookInfo.orgId}/`;

        this.plHttpSvc.get('', params, url).subscribe(
            (response: any) => {
                this.loadSummaryContent(response);
            },
            () => {
                this.loadSummaryContent([]);
            },
        );
    }

    /**
     * Specific function for Summary content since Summary is the default content selected and displayed.
     */
    private loadSummaryContent(contents: any[]) {
        if (contents.length > 0) {
            this.orderContentProperties(contents[0], contents[0].section_type.code);
            this.contents = contents; // Actual loading of contents in table

            setTimeout(() => {
                this.readContentsNativeElements();
                this.setActiveStateOnContentSection(contents[0].section_type.name);
                this.emitContentThroughEvent(contents[0]);
            }, 0);
        } else {
            this.emitContentThroughEvent(null);
        }
    }

    /**
     * Extra properties that Content needs before being emitted are added here.
     * If content has property 'section_type' is coming from API reponse.
     * Otherwise is an empty made object; therefore different threatments of data.
     */
    private orderContentProperties(content: any, contentCd: string, contentNo: number = 1, contentName: string = null) {
        let contentWrapper = content;

        if (content.hasOwnProperty('section_type')) {
            content.handbookInfo = this.handbookInfo;
            contentWrapper = content.section_type;
        }
        if (contentName) {
            contentWrapper.name = contentName;
        }

        contentWrapper.number = contentNo;
        contentWrapper.description = this.CONTENTS_DESC[contentCd].description;
    }

    private readContentsNativeElements() {
        this.contentsElemRef = this.contentsElementRef.nativeElement.getElementsByClassName(this.PL_TD_CLASS);
        this.contentsElemRefLength = this.contentsElementRef.nativeElement.getElementsByClassName(this.PL_TD_CLASS).length;
    }

    private setActiveStateOnContentSection(sectionName: string) {
        if (this.contentsElemRefLength > 0 && sectionName) {
            let i; let color; let leftBorderStyle; let marginLeft;

            for (i = 0; i < this.contentsElemRefLength; i++) {
                color = '';
                leftBorderStyle = '';
                marginLeft = '';

                if (this.contentsElemRef[i].innerText.includes(sectionName)) {
                    color = '#4D8BBE';
                    leftBorderStyle = '3px solid #4D8BBE';
                    marginLeft = '-3px';
                }

                this.contentsElemRef[i].style.borderColor = color;
                this.contentsElemRef[i].children[0].style.color = color;
                this.contentsElemRef[i].children[0].style.borderLeft = leftBorderStyle;
                this.contentsElemRef[i].children[0].children[0].style.marginLeft = marginLeft;
            }
        }
    }

    //#endregion Private Functions
}
