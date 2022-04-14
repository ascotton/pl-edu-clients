import { PL_CLIENT_SERVICE_STATUS, PL_CLIENT_SERVICE_COMPLETED_REASON, PL_CLIENT_SERVICE_CANCELLED_REASON } from '@common/enums';

export interface PLDirectServiceInterface {
    id: string;
    status: PL_CLIENT_SERVICE_STATUS;
    completedReason?: PL_CLIENT_SERVICE_COMPLETED_REASON;
    completedOtherReason?: string;
    cancelledReason?: PL_CLIENT_SERVICE_CANCELLED_REASON;
    cancelledOtherReason?: string;
}
