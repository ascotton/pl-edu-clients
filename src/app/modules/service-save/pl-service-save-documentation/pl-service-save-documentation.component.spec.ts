import { ReactiveFormsModule } from '@angular/forms';
import { MockComponent, MockModule } from 'ng-mocks';
import { PLServiceSaveService } from '../pl-service-save.service';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { PLInputFileComponent } from '@root/src/lib-components/pl-input/pl-input-file.component';
import { PLInputDatepickerComponent } from '@root/src/lib-components/pl-input/pl-input-datepicker.component';
import { PLInputRadioGroupComponent } from '@root/src/lib-components/pl-input/pl-input-radio-group.component';
import { PLServiceSaveDocumentationComponent } from './pl-service-save-documentation.component';
import { PLInputSelectComponent } from '@root/src/lib-components/pl-input/pl-input-select.component';

describe('PLServiceSaveDocumentationComponent', () => {
    let spectator: Spectator<PLServiceSaveDocumentationComponent>;

    const createComponent = createComponentFactory({
        component: PLServiceSaveDocumentationComponent,
        imports: [
            MockModule(ReactiveFormsModule),
        ],
        declarations: [
            MockComponent(PLInputFileComponent), MockComponent(PLInputDatepickerComponent),
            MockComponent(PLInputRadioGroupComponent),
            MockComponent(PLInputSelectComponent),
        ],
        mocks: [
            PLServiceSaveService,
        ],
        detectChanges: false,
    });

    beforeEach(() => spectator = createComponent());

    it('should succed', () => {
        expect(spectator.component).toBeTruthy();
        expect(spectator.component).toBeDefined();
    });

    describe('Documentation Steps Scenario', () => {

        it('should call onchangeStep with \'valid\' prop false when valid \'showDocs.dueDate\' and invalid \'serviceFormVals.dueDate\'', () => {
            spectator.component.showDocs.dueDate = true;
            spectator.component.serviceFormVals = {};

            spectator.component.validate();
        });

    });
});
