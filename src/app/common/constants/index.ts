export const CLINICAL_PRODUCT_TYPE = {
    CODE: {
        BIG: 'groupbmh_bi',
        DIR_SVC: 'direct_service',
        EVAL: 'evaluation_with_assessments',
        SV: 'supervision',
        TG: 'groupbmh_ti',
        BMH_GROUP: 'group_bmh',
        CONS: 'consultation',
        REC_REV: 'records_review',
        SC: 'screening',
    },
    NAME: {
        BIG: 'Behavior Intervention Group',
        DIR_TE: 'Direct Therapy',
        EVAL: 'Evaluation',
        SV: 'Supervision',
        TE: 'Therapy',
        TG: 'Trauma-informed Group',
        TG_CAPITALIZE: 'Trauma Informed Group',
        BIG_LOWER_CASE: 'big',
        BIG_LOWER_CASE2: 'behavior intervention group',
        TG_LOWER_CASE: 'trauma informed group',
        TG_LOWER_CASE2: 'trauma-informed group',
        BIG_UPPER_CASE: 'BIG',
        TG_UPPER_CASE: 'TRAUMA INFORMED GROUP',
    },
};

/**
 * Use it in the `data.title` property of the routing modules.
 * Either set `SKIP` and set the default `PL` title to a page tab.
 * Or set it `DYNAMIC` and make `pl-tabs` to set the title based on sub navigation with dynamic names.
 *   e.g. $USER - $SCHOOL - Presence Learning.
 */
export const ROUTING = {
    SKIP: 'SKIPHISTORY',
    DYNAMIC: 'USE_DYNAMIC_SUBNAVIGATION',
};
