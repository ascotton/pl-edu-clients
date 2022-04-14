import { createAction, props } from '@ngrx/store';

const featureNamespace = '[Documentation]';

export const PLFetchDocumentationAssistant = createAction(`${featureNamespace} Fetch Assistant Data`,
    props<{ provider?: string }>());

export const PLSetDocumentationAssistant = createAction(`${featureNamespace} Set Assistant Data`,
    props<{ data: any }>());
