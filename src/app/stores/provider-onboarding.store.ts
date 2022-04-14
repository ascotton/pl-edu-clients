export function providerOnboardingStore(state: any = {}, action: any) {
    const type = action.type;
    const payload = action.payload;
    switch (type) {
        case 'UPDATE_PROVIDER_ONBOARDING':
            return payload;
        case 'UPDATE_PROVIDER_ONBOARDING_STEP':
            if (state.steps) {
                return {
                    ...state,
                    steps: state.steps
                        .map(step => step.key === payload.stepKey ?
                            ({ ...step, ...payload.step }) : step),
                };
            }
            return state;
        default:
            return state;
    }
}
