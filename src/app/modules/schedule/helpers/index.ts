import { Option, PLBillingCode } from '@common/interfaces';
import { PLClient, PLEvaluation, PLClientService, PLEventClient, PLLocation } from '../models';
import * as moment from 'moment';

export const GROUP_BY = (list: any[], keyGetter: Function) => {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
};

// type FormatterFunc<T> = (list: T[]) => PLOption[];
// : { [key: string]: FormatterFunc<any> }
export const PL_OPTIONS_FORMATTER = {
    ClientEvents: (clients: PLEventClient[]): Option[] => {
        return clients.map((c: PLEventClient) => {
            return { value: c.uuid, label: `${c.first_name} ${c.last_name}` };
        });
    },
    Clients: (clients: PLClient[]): Option[] => {
        return clients.map((c: PLClient) => {
            return { value: c.uuid, label: `${c.first_name} ${c.last_name}` };
        });
    },
    ClientServices: (services: PLClientService[]): Option[] => {
        const serviceLabelMap = {
            consultation_bmh: 'BMH Consultation',
            direct_bmh: 'BMH Direct',
            consultation_ot: 'OT Consultation',
            supervision_ot: 'OT Supervision',
            direct_ot: 'OT Direct',
            consultation_slt: 'SLT Consultation',
            supervision_slt: 'SLT Supervision',
            direct_slt: 'SLT Direct',
        };

        return services.map((e) => {
            const { uuid: value, service_expanded: service, details } = e;
            const { start_date, end_date } = details;

            const start = start_date ? moment.utc(start_date).format('M/YYYY') : '';
            const end = end_date ? moment.utc(end_date).format('M/YYYY') : '';
            const time = (start && end) ? `${start} - ${end}` : start ? `${start} - no end date` : '';
            const labelPrefix = serviceLabelMap[service.code];
            let label = service.name;
            label = `${labelPrefix || label} ${time}`;
            return { label, value };
        });
    },
    Evaluations: (evaluations: PLEvaluation[]): Option[] => {
        return evaluations.map((c: PLEvaluation) => {
            return { value: c.uuid, label: `${c.client_expanded.first_name} ${c.client_expanded.last_name}` };
        });
    },
    Locations: (locations: PLLocation[]): Option[] => {
        return locations.map((l: PLLocation) => ({ value: l.uuid, label: l.name }));
    },
    BillingCodes: (codes: PLBillingCode[]): Option[] => {
        return codes.map((c: PLBillingCode) => ({ value: c.uuid, label: c.name }));
    },
    SingleValue: (values: any[]): Option[] => {
        return values.map((value: any) => ({ value, label: value }));
    },
};

export const GET_LOCAL_DATE = (date: string, TZ?: string) => {
    const _date = moment(date);
    return TZ ? _date.tz(TZ) : _date;
};

export const EVENT_TITLE_FORMATRER = () => {

};
