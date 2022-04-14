export enum PL_CALENDAR_VIEW {
    Day = 'timeGridDay',
    Week = 'timeGridWeek',
    Month = 'dayGridMonth',
    List = 'listWeek',
}

export enum PL_CALENDAR_VIEW_USER {
    Day = 'day',
    Week = 'week',
    Month = 'month',
    List = 'list',
}

export const PL_CALENDAR_VIEW_CONVERTER_USER = {
    [PL_CALENDAR_VIEW.Day]: PL_CALENDAR_VIEW_USER.Day,
    [PL_CALENDAR_VIEW.Week]: PL_CALENDAR_VIEW_USER.Week,
    [PL_CALENDAR_VIEW.Month]: PL_CALENDAR_VIEW_USER.Month,
    [PL_CALENDAR_VIEW.List]: PL_CALENDAR_VIEW_USER.List,
};

export const PL_CALENDAR_VIEW_CONVERTER = {
    [PL_CALENDAR_VIEW_USER.Day]: PL_CALENDAR_VIEW.Day,
    [PL_CALENDAR_VIEW_USER.Week]: PL_CALENDAR_VIEW.Week,
    [PL_CALENDAR_VIEW_USER.Month]: PL_CALENDAR_VIEW.Month,
    [PL_CALENDAR_VIEW_USER.List]: PL_CALENDAR_VIEW.List,
};
