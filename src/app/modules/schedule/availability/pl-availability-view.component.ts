import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppStore } from '@app/appstore.model';
import { User } from '@modules/user/user.model';
import { CanComponentDeactivate } from '@common/can-deactivate-guard.service';
import { PLBrowserService, PLUrlsService, PLWindowService, PLGraphQLService,
  PLConfirmDialogService, PLToastService, PLMayService } from '@root/index';
import { PLUtilService } from '@common/services';

// grid sizing
const ROW_HEIGHT = 15;
const BLOCK_WIDTH = 123;
const TIME_COLUMN_WIDTH = 110;

// font-size of information displayed in a block
const BLOCK_CONTENT_FONT_SIZE = 12;

 // block size constraints
const MIN_BLOCK_HOURS = 2;
const SLOTS_PER_HOUR = 2;
const MIN_SLOTS_PER_BLOCK = MIN_BLOCK_HOURS * SLOTS_PER_HOUR;
const MAX_SLOT = 24 * SLOTS_PER_HOUR;
const MAX_START_SLOT = MAX_SLOT - MIN_SLOTS_PER_BLOCK;

const FIRST_BUSINESS_HOUR_SLOT = 14;
const WEEKDAY_INDEX_ARRAY = [0, 1, 2, 3, 4];

const DOM_AVAILABILITY_START = 'availability-start';
const DOM_AVAILABILITY_END = 'availability-end';

const KEY_SELECT_START_HANDLER = 'SELECT_START_HANDLER';
const KEY_SELECT_END_HANDLER = 'SELECT_END_HANDLER';
const KEY_UNLOAD_HANDLER = 'UNLOAD_HANDLER'

/**
 * TimeSlot - information related to each valid block time values.
 * The set of block times range from 12am to 12pm in increments of 30 minutes.
 */
interface TimeSlot {
  hour: number,
  isAM: boolean,
  label: string,
  label_mil: string,
  slot: number,
  value: string,
};

interface TimeBlock {
  col: number, // day column number
  start: number, // slot number
  end: number, // slot number
  hrs: number, // calculated timespan
  hover: boolean, // addressable state
  style: TimeBlockPosition, // positioning in the grid
  clone: TimeBlock, // copy of original values during edit in case edit is discarded
  value?: string, // used for {label, value} options
  _id: number, // a unique value for easy comparison
}

interface TimeBlockPosition {
  left: number,
  top: number,
  contentTop: number,
  width: number,
  height: number,
}

interface RawTimeBlockFromApi {
  day: string, // day of the week
  start: string, // start time, e.g. '07:00:00'
  end: string, // end time, e.g. '15:00:00'
}

@Component({
  selector: 'pl-availability-view',
  templateUrl: './pl-availability-view.component.html',
  styleUrls: ['./pl-availability-view.component.less']
})
export class PLAvailabilityViewComponent implements CanComponentDeactivate, OnInit, OnDestroy {
  @Input() showTips: boolean = false;
  @Input() saveConfirm: boolean = true;
  @Input() blockReload: boolean = true;
  @Input() fullPage: boolean = true;
  @Input() showTabs = true;
  @Input() isCAMView = false;
  @Input() provider: any;

  @Output() onSave = new EventEmitter<any>();

  unloadListenerActive = false;
  classesWrapper = {
      fullPage: false,
  };
  hasAgreed = false;
  isDoneEnteringTime = false;
  tabs: any[];
  readOnly = false;
  rawBlocks: any;
  blocks: any[];

  private user: User;
  private windowObj: any;

  // root data object for managing data-model and logic state
  data: any = {
    const: {
      MIN_SLOTS_PER_BLOCK,
      MAX_START_SLOT,
      FIRST_BUSINESS_HOUR_SLOT,
      WEEKDAY_INDEX_ARRAY,
      SCROLL_OPTIONS_VIEWPORT_CENTER: { behavior: 'smooth', block: 'center' },
      SCROLL_OPTIONS_VIEWPORT_TOP: { behavior: 'smooth', block: 'start' },
    },
    state: {
      rows: <TimeSlot[]> [],
      // each block contains {col, start, end, hrs}
      // NOTE: a block can be uniquely identified with `${block.col}_${block.start}` or simply `${block._id}`
      blocks: <TimeBlock[]> [],
      // valid start time options for the active selected day.
      startTimes: <TimeSlot[]>[],
      // valid end time options for the active selected day.
      endTimes: <TimeSlot[]> [],
      activeBlock: {},
      dailyHours: [],
      totalAvailableHours: 0,
      maxHoursOptions: [],
      maximized: false,
      scale: 'small',
      listeners: {},
      flags: {
        DEBUG: 0,
        DEBUG_INLINE_CONSOLE: 0,
        SHOW_ZOOM: 0,
        FORCE_SAVE_ERROR: 0,
        SIMULATE_SAVE_ERROR: 0,
      }
    },
    model: {
      raw: {},
      start: null,
      end: null,
      selectedDay: '0',
      maxHours: 0,
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<AppStore>,
    private plBrowser: PLBrowserService,
    public plUrls: PLUrlsService,
    private plGraphQL: PLGraphQLService,
    private plConfirm: PLConfirmDialogService,
    private plWindow: PLWindowService,
    private plToast: PLToastService,
    private plMay: PLMayService,
    public util: PLUtilService,
  ) {
      MODEL = this.data.model;
      STATE = this.data.state;
      CONST = this.data.const;
      this.windowObj = window;
      this.$window.addEventListener('beforeunload', STATE.listeners[KEY_UNLOAD_HANDLER] = this._unload());
      this.unloadListenerActive = true;
  }

  onChangeDay(columnIndex: string) {
    this._cleanupBlocks();
    this._reset();
    MODEL.selectedDay = columnIndex;
    this._findValidStartTimes(parseInt(MODEL.selectedDay));
  }

  /**
   * Handles changes to start time
   * UPDATE:
   * - end-time
   * - active-block
   *
   * @param slot
   */
  onChangeStartTime(slot: any) {
    this._findValidEndTimes(slot);
    this._renderActiveBlock();
    this._printData('Select Start Time');
  }

  /**
   * Handles changes to end time
   * UPDATE:
   * - active-block
   *
   * @param slot
   */
  onChangeEndTime(slot: any) {
    this._renderActiveBlock();
    this._printData('Select End Time');
  }

    onHoursChanged(selectedHours: any) {
        this.blocks = selectedHours.blocks;
        if (!selectedHours.init) {
            STATE.totalAvailableHours = selectedHours.totalHours;
            this._updateMaxHoursOptions();
        }
    }

  /**
   * Save active-block
   * UPDATES:
   *
   * @param event
   * @param block
   */
  onClickSaveActiveBlock(block?: any) {
    if (!STATE.activeBlock.style) return;
    this._saveActiveBlock();
    this._reset();
    this._doAfterMutations();
    this._printData('Save Time Block');
  }

  onClickCancelActiveBlock(block?: any) {
    this._reset();
    this._doAfterMutations();
    this._printData('Cancel Time Block');
  }

  onClickCalendarTab() {
    this.router.navigate(['schedule']);
    // this.plWindow.location.href = this.plUrls.urls.scheduleFE + '/calendar/';
  }

  /**
   * Edit an existing block.
   *
   * If another block is already in edit mode, cancel the edit by restoring
   * the original block.
   *
   * Enter edit mode through a combination of
   * - delete the saved block and store it for reference as the Edit Block
   * - copy the saved block properties to the form model
   * - copy the saved block
   *
   * @param event
   * @param block
   */
  onClickEditBlock(event: any, block: any) {
    const editBlock = STATE.blocks.find((_: TimeBlock) => _.clone);
    if (editBlock) {
      delete editBlock.clone;
      this._cleanupBlocks();
    }

    block.clone = this._clone(block);

    this._findValidStartTimes(block.col);
    MODEL.selectedDay = `${block.col}`;
    MODEL.start = `slot_${block.start}`;
    MODEL.end = `slot_${block.end}`;

    // mutates the active-block
    this.onChangeStartTime(MODEL.start)
    if (event) {
      event.stopPropagation();
    }

    STATE.activeBlock.clone = block.clone;
    this._printData('Edit Time Block');
  }

  onClickDeleteBlock(event: any, block: any) {
    if (event) {
      event.stopPropagation();
    }

    const blockToDelete = STATE.blocks.find((_: TimeBlock) => _._id === block._id);
    if (blockToDelete) {
      const editBlock = STATE.blocks.find((_: TimeBlock) => _.clone);
      if (editBlock) {
        delete editBlock.clone;
      }
      MODEL.selectedDay = `${block.col}`;
      this._cleanupBlocks();
      this._reset();
      STATE.blocks = STATE.blocks.filter((_: TimeBlock) => !(_.col === block.col && _.start === block.start));
      this._doAfterMutations();
      this._printData('Delete Time Block');
    }
    return blockToDelete;
  }

  onClickSubmitForm() {
    if (this.saveConfirm) {
        this.plConfirm.show({
          header: 'Maximum Hours',
          content: `<span style="padding-bottom:12px;">I'd like to work a maximum of <b>${MODEL.maxHours}</b> hours per week with students<br />(about <b>${this.getTotalWorkingHours()} total working hours per week</b>, including all meetings, direct sessions, and paperwork).</span>`,
          primaryLabel: 'Confirm',
          secondaryLabel: 'Cancel',
          primaryCallback: () => {
            this._printData('Save Data');
            STATE.readyToExit = true;
            STATE.saving = true;
            this._setAvailability();
          },
          secondaryCallback: () => {
            this._printData('Cancel Save');
          },
        });
    } else {
        this._printData('Save Data');
        STATE.readyToExit = true;
        STATE.saving = true;
        this._setAvailability();
    }
    this._printData('Submit Form');
  }

  onClickMaximizeView() {
    STATE.maximized = !STATE.maximized;
    if (!STATE.maximized) {
      STATE.scale = 'small';
      setTimeout(()=>{
        document.getElementById('zoomScale').scrollIntoView(true);
      },1);
    }
  }

  onClickZoomScale(scale: string) {
    STATE.scale = scale;
  }

  isProvider() {
    return this.plMay.isProvider(STATE.user);
  }

  isDevDebug(key: string): Boolean {
    return !!(STATE.flags[`${key}`] || STATE.flags[`ALL`]) || (!!localStorage.getItem(key));
  }

  // a block clone is created when editing a block in case the edit is discarded
  getCloneBlock() {
    const index = STATE.blocks.findIndex((_: TimeBlock) => _.clone);
    if (index > -1) {
      return {
        index,
        block: STATE.blocks[index]
      }
    }
  }

  // helps identify (and scroll to) the beginning of the business day in the visualization grid
  getFirstBusinessHourId(index: number) {
    return index === FIRST_BUSINESS_HOUR_SLOT ? 'id_init_view_top' : null;
  }

  getSaveErrors() {
    return STATE.saveErrors;
  }

  hasSaveErrors() {
    return STATE.saveErrors && STATE.saveErrors.length;
  }

  scrollFirstBusinessHourIntoView(): void {
    setTimeout(() => {
      if (!STATE.maximized) {
        document.getElementById('id_init_view_top').scrollIntoView(CONST.SCROLL_OPTIONS_VIEWPORT_TOP);
      }
    }, 250);
  }

  // For scrollStartTimeIntoView() and scrollEndTimeIntoView()
  // We need to scroll the options to a specified value
  // Workaround the limitations of the pl-input-select component...
  // - if activeBlock, use its start value
  // - else use the earliest time, where 7am <= time < 6pm
  // - else use the first item in the list

  scrollStartTimeIntoView() {
    const options = document.querySelectorAll(`.${DOM_AVAILABILITY_START} .option`);
    const optionsArray = Array.from(options);
    if (!optionsArray || !optionsArray.length) {
      return;
    }
    const activeBlock = STATE.activeBlock;
    if (activeBlock && activeBlock.start) {
      const start = STATE.rows[activeBlock.start].label;
      const timeOptionElement: any = optionsArray.find((item: any) => item.textContent === start);
      this._scrollSelectOptionElementIntoView(timeOptionElement);
      return;
    }

    const timeOptionElement = optionsArray.find((item: any) => BUSINESS_HOURS[item.textContent]) || optionsArray[0];
    this._scrollSelectOptionElementIntoView(timeOptionElement);
  }

  scrollEndTimeIntoView() {
    const options = document.querySelectorAll(`.${DOM_AVAILABILITY_END} .option`);
    const optionsArray = Array.from(options);
    if (!optionsArray || !optionsArray.length) {
      return;
    }
    const endSlot = MODEL.end;
    if (endSlot) {
      const endIndex = endSlot.split('_')[1];
      const end = STATE.rows[endIndex].label;
      const timeOptionElement: any = optionsArray.find((item: any) => item.textContent === end);
      this._scrollSelectOptionElementIntoView(timeOptionElement);
    }
  }

  //------- private business and utility methods ----
  private _init() {
    STATE.user = this.user;

    const xProvider = STATE.user['xProvider'];
    if (xProvider) {
      STATE.timezone = xProvider.timezone;
      STATE.timezonePrefix = xProvider.timezone.split('/')[0];
      STATE.timezoneCity = xProvider.timezone.split('/')[1].replace(/_/g, ' ');
    }

    STATE.dayOptions = [
      { label: 'Mon', value: '0' },
      { label: 'Tue', value: '1' },
      { label: 'Wed', value: '2' },
      { label: 'Thu', value: '3' },
      { label: 'Fri', value: '4' },
    ];

    MODEL.selectedDay = STATE.dayOptions[0].value;

    this._buildTimeSlots();

    const providerId = this.provider && this.provider.user.id;
    if (this.provider) {
      STATE.timezone = this.provider.timezone;
    }
    this._getAvailability(providerId).pipe(first()).subscribe((res: any) => {
      const raw = MODEL.raw.availability = res;
      this.rawBlocks = raw.availabilityBlocks;
      // assign model availability blocks
      if (raw.availabilityBlocks && raw.availabilityBlocks.length) {
        STATE.blocks = raw.availabilityBlocks.map((rawBlock: RawTimeBlockFromApi) => {
          const start = STATE.rows.find((_: TimeSlot) => _.label_mil === rawBlock.start);
          let end = STATE.rows.find((_: TimeSlot) => _.label_mil === rawBlock.end);
          // 00:00:00 occurs twice in the rows array (the day begins and ends at midnight)
          // if the end is midnight, interpret it as the slot at the the end of the day.
          if (end.slot === 0) {
            end = STATE.rows[STATE.rows.length - 1];
          }
          return this._getBlockWithPosition({
            col: WEEKDAYS.indexOf(rawBlock.day),
            start: start.slot,
            end: end.slot,
            hrs: this._getBlockHours(start.slot, end.slot),
            hover: false,
            _id: Math.random(),
          });
        })
      }

      this._doAfterMutations();

      // assign model max hours
      MODEL.maxHours = raw.availabilityPreference && this.getTimeWithStudentsHours(raw.availabilityPreference.maxWeeklyHours);
      if (MODEL.maxHours && MODEL.maxHours > 0) this.isDoneEnteringTime = true;

      STATE.dataInitialized = true;
      STATE.pageInitialized = true;
      this._printData('Init');
      if (!this.isCAMView) {
        setTimeout(() => {
          this.scrollFirstBusinessHourIntoView();
          if (document.getElementsByClassName(DOM_AVAILABILITY_START)[0]) {
            document.getElementsByClassName(DOM_AVAILABILITY_START)[0]
              .addEventListener('click', STATE.listeners[KEY_SELECT_START_HANDLER] = () => {
                setTimeout(() => {
                  this.scrollStartTimeIntoView();
                }, 1);
              });
          }
  
          if (document.getElementsByClassName(DOM_AVAILABILITY_END)[0]) {
            document.getElementsByClassName(DOM_AVAILABILITY_END)[0]
              .addEventListener('click', STATE.listeners[KEY_SELECT_END_HANDLER] = () => {
                setTimeout(() => {
                  this.scrollEndTimeIntoView();
                }, 1);
              });
          }
          this.$window.scrollTo(0, 0);
        }, 1);
      } else {
        this.scrollFirstBusinessHourIntoView();
      }
    });
  }

  private _getAvailability(providerId?: string) {
      if (!providerId) {
          return this.plGraphQL.query(GQL_GET_AVAILABILITY).pipe(first());
      }
      return this.plGraphQL.query(GQL_GET_PROVIDER_AVAILABILITY, {providerId}).pipe(first());
  }

    private _setAvailability() {
        const availabilityBlocks = this.blocks.map((block) => {
            return {
                day: block.day,
                start: block.start,
                end: block.end,
            };
        });
        const payload: any = {
            availabilityBlocks,
            availabilityPreference: {
                maxWeeklyHours: this.getTotalWorkingHours(),
            },
        };

        if (this.isDevDebug('FORCE_SAVE_ERROR')) {
            payload.availabilityBlocks.push ({day:1});
        }

        this.plGraphQL.mutate(GQL_SET_AVAILABILITY, payload, {debug: false})
        .pipe(first())
        .subscribe(
          (res: any) => {
              MODEL.raw.setAvailability = res;
              this._printData('Save Availability');

              if (this.isDevDebug('SIMULATE_SAVE_ERROR_RESPONSE')) {
                  res.errors = [{
                      code: 'debug_error',
                      message: 'Debug Error',
                  }]
              }
              const errors = res.errors;
              if (errors && errors.length) {
                  const err = errors[0];
                  this._doneSavingWithError(JSON.stringify(err), payload);
              } else {
                  if (this.onSave && this.onSave.observers.length) {
                      this.onSave.emit({});
                  } else {
                      // short delay for user to see "saving" message.
                      setTimeout(() => {
                          // TODO: Remove Leave warning 
                          this.unloadListenerActive = false;
                          this.router.navigate(['/schedule']);
                          // this.plWindow.location.href = this.plUrls.urls.scheduleFE + '/calendar/';
                      }, 1000);
                  }
              }
          },
          (err: any) => {
              this._doneSavingWithError(err.message, payload);
          });
    }

  /**
   * Save the active block.
   * @param isBlockClicked - when clicking save on the block itself (vs a form button)
   */
  private _saveActiveBlock(isBlockClicked?:boolean) {
    const activeBlock =  STATE.activeBlock;
    activeBlock.hrs = this._getBlockHours(activeBlock.start, activeBlock.end);
    activeBlock._id = activeBlock._id || Math.random();
    if (activeBlock.clone) {
      const cloneBlockIndex = STATE.blocks.findIndex((_: TimeBlock) => _.clone);
      if (cloneBlockIndex > -1) {
        STATE.blocks[cloneBlockIndex] = this._clone(activeBlock);
        delete activeBlock.clone;
      }
    } else {
      STATE.blocks.push(this._clone(activeBlock));
    }
    if (!isBlockClicked && !STATE.maximized) {
      document.getElementById('activeBlock').scrollIntoView(CONST.SCROLL_OPTIONS_VIEWPORT_CENTER);
    }
    activeBlock.hover = false;
  }

  private _getBlockHours(start: number, end: number) {
    const delta = end - start;
    return Math.floor(delta / SLOTS_PER_HOUR) + (delta % 2 ? 0.5 : 0);
  }

  _scrollSelectOptionElementIntoView(optionElement: any) {
    // HACK: brittle dependence on DOM structure of pl-input-select option elements
    const clipElement: Element = optionElement.parentNode.parentNode.parentNode.parentNode;
    clipElement.scrollTop = optionElement.offsetTop;
  }

  private _reset() {
    MODEL.start = null;
    MODEL.end = null;
    STATE.startTimes = [];
    STATE.endTimes = [];

    const editBlock = this.getCloneBlock();
    if (editBlock) {
      delete editBlock.block.clone;
    }

    STATE.activeBlock = {};
  }

  private _cleanupBlocks() {
    STATE.blocks.forEach((item:any) => {
      item.hover = false;
      item.hoverTrash = false;
      item.hoverEdit = false;
    });
  }

  private _buildTimeSlots() {
    // use this twice below, for AM and PM
    const __buildSlots = (isAM: boolean) => {
      for (let hr = 0; hr < 12; hr++) {
        for (let parts = 0; parts < 2; parts++) {
          const hour = hr % 12 || 12;
          const minute = parts ? 30 : 0;
          const slot = hr * 2 + parts + (isAM ? 0 : 24);
          //const hour_mil = isAM && hour === 12 ? 0 : (isAM ? hour : hr + 13);
          const hour_mil = (()=>{
            if (hour === 12 && isAM) return 0;
            if (hour === 12 && !isAM) return 12;
            return isAM ? hour : hr + 12;
          })();
          const value = `slot_${slot}`;
          const label = `${hour}:${minute ? '30' : '00'} ${isAM ? 'am' : 'pm'}`;
          //@ts-ignore - for String.padStart (es2017)
          const label_mil = `${(''+hour_mil).padStart(2, '0')}:${(''+minute).padStart(2, '0')}:00`;
          STATE.rows.push({ label, label_mil, value, slot, hour, isAM });
        }
      }
    }
    __buildSlots(true /* AM */);
    __buildSlots(false /* PM */);

    // add the final row
    // NOTE: the final row gets special treatment in the UI
    // TODO: explain why it gets special treatment...
    const finalRow = {
      label: `12:00 am`,
      label_mil: `00:00:00`,
      value: `slot_${48}`,
      slot: 48,
      hour: 12,
      isAM: true,
    };
    STATE.rows.push(finalRow);
  }

  private _renderActiveBlock() {
    const item = {
      col: parseInt(MODEL.selectedDay),
      start: this._parseSlotString(MODEL.start),
      end: this._parseSlotString(MODEL.end),
    }
    STATE.activeBlock = {
      ...(STATE.activeBlock || {}),
      ...this._getBlockWithPosition(item),
    };

    if (!STATE.maximized && !this.isCAMView) {
      setTimeout(() => {
        document.querySelectorAll('#activeBlock .save-button')[0].scrollIntoView(CONST.SCROLL_OPTIONS_VIEWPORT_CENTER);
      },100)
    }
  }

  // NOTE - the magic numbers make the position calculations work...
  private _getBlockWithPosition(item: any) {
    const top = item.start * ROW_HEIGHT + item.start;
    const bottom = item.end * ROW_HEIGHT + item.end - 3;
    const height = bottom - top;
    const left = (TIME_COLUMN_WIDTH + 1) + (item.col * (BLOCK_WIDTH + 2)) + item.col;
    const width = BLOCK_WIDTH;
    const contentTop = height / 2 - (BLOCK_CONTENT_FONT_SIZE + 2);
    return {
      ...item,
      style: { top, left, height, width, contentTop }
    };
  }

  private _findValidStartTimes(column: number) {
    // find all the blocks for the selected day,
    // in start-time order, so that we can sequence
    // the available spaces for new blocks.
    const blocks = STATE.blocks
      .filter((_: TimeBlock) => _.col === column)
      .filter((_: TimeBlock) => !_.clone)
      .sort((a: TimeBlock, b: TimeBlock) => a.start - b.start);

    // search the space before, after, and between each block
    // for valid block space
    let timeSlot = 0;
    const startTimes = <TimeSlot[]> [];
    blocks.forEach((_: TimeBlock) => {
      while (timeSlot <= _.start - MIN_SLOTS_PER_BLOCK) {
        startTimes.push(STATE.rows[timeSlot]);
        timeSlot++;
      }
      timeSlot = _.end;
    });
    while (timeSlot <= MAX_START_SLOT) {
      startTimes.push(STATE.rows[timeSlot]);
      timeSlot++;
    }
    STATE.startTimes = startTimes;
  }

  private _findValidEndTimes(startSlot: string) {
    if (!MODEL.start) {
      return;
    }
    const column = parseInt(MODEL.selectedDay);
    const startSlotValue = this._parseSlotString(startSlot);
    const blocks = STATE.blocks
      .filter((_: TimeBlock) => _.col === column)
      .sort((a: TimeBlock, b: TimeBlock) => a.start - b.start);

    const nearestBlockAfterSlot = blocks.find((_: TimeBlock) => {
      const activeBlockId = STATE.activeBlock && STATE.activeBlock.clone && STATE.activeBlock.clone._id;
      return startSlotValue < _.start && _._id !== activeBlockId;
    });

    let timeSlot = startSlotValue + MIN_SLOTS_PER_BLOCK;
    const endTimes = <TimeSlot[]>[];
    if (nearestBlockAfterSlot) {
      while (timeSlot <= nearestBlockAfterSlot.start) {
        endTimes.push(STATE.rows[timeSlot]);
        timeSlot++;
      }
    } else {
      while (timeSlot <= MAX_SLOT) {
        endTimes.push(STATE.rows[timeSlot]);
        timeSlot++;
      }
    }
    if (endTimes.length) {
      const found = endTimes.find((_: TimeSlot) => _.value === MODEL.end);
      if (!found) {
        MODEL.end = `slot_${startSlotValue + MIN_SLOTS_PER_BLOCK}`;
      }
    }
    STATE.endTimes = endTimes;
  }

  private _computeDailyHours() {
    const result = [];
    for (let i=0;i<5;i++) {
      const hours = STATE.blocks
        .filter((_: TimeBlock) => _.col === i)
        .reduce((result: number, _: TimeBlock) => {
          return result += _.hrs;
        }, 0);
      result.push(hours);
    }
    STATE.dailyHours = result;
  }

  private _updateTotalHours() {
    STATE.totalAvailableHours = STATE.dailyHours.reduce((result: number, _: number) => result + _, 0);
  }

  _updateMaxHoursOptions() {
    MODEL.maxHours = 0;
    if (STATE.totalAvailableHours < 1) {
      STATE.maxHoursOptions = [];
      return;
    }
    const start = 1;
    const end = STATE.totalAvailableHours;
    let result: any[] = [];
    let next = start;
    while (true) {
      result = [...result, {label: next, value: next}];
      // limit available hours to 32 hours with students (40 total hours)
      if (end < start || next === end || next === 32) break;
      next += 0.5;
    }
    STATE.maxHoursOptions = result;
  }

  private _doAfterMutations() {
    this._findValidStartTimes(parseInt(MODEL.selectedDay));
    this._findValidEndTimes(MODEL.start);
    this._computeDailyHours();
    this._updateTotalHours();
    this._updateMaxHoursOptions();
  }

  private _unload() {
    return (event: any) => {
      if (!STATE.readyToExit) {
        // NOTE - Chrome will not display this custom message, but as long as something is returned, it will
        // display a confirmation dialog
        event.returnValue = 'Are you sure you want to close this window?';
      }
    }
  }

  // return slot number
  private _parseSlotString(slot: string) {
    return parseInt(slot.split('_')[1]);
  }

  private _setDevDebug(csv: String) {
    STATE.flags = csv.split(',').reduce((result: any, item: String) => {
      result[`${item}`] = 1;
      return result;
    }, STATE.flags);
  }

  private _printData(context?:string) {
    console.log(`-- [${context.toUpperCase()}]`, this.data);
  }

  private _isChrome() {
    return this.plBrowser.isSupported(['chrome']);
  }

  private _clone(o: any) {
    let clone, v, key;
    clone = Array.isArray(o) && [] || {};
    for (key in o) {
      v = o[key];
      clone[key] = (typeof v === "object") ? this._clone(v) : v;
    }
    return clone;
  }

  private _doneSavingWithError(err: any, payload: any) {
    const error = this._processErrors(err, payload);
    this._printData('Save error');
    STATE.saveErrors = [error];
    STATE.saving = false;
    this.plConfirm.hide();
    this.plToast.delayHide(100);
  }

  private _processErrors(err: any, payload: any) {
    return {
      request_payload: payload,
      response_error: `${err.message || err}`,
      timestamp: new Date(),
      url: document.location.href,
      browser: navigator.userAgent,
      platform: navigator.platform,
    };
  }

  copyErrorInfoToClipboard() {
    this.util.copyToClipboard('#errorDataSupport');
  }

  // Other
  ngOnInit() {
    this.store
      .select('currentUser')
      .pipe(first((user: User) => !!user.uuid))
      .subscribe((user: User) => {
        this.user = user;
        this.route.queryParams.pipe(first()).subscribe((params: any) => {
          if (params.flags) {
            this._setDevDebug(params.flags);
          }
          this._init();
        });
      });
    if (!this.blockReload && this.unloadListenerActive) {
        this.$window.removeEventListener('beforeunload', STATE.listeners[KEY_UNLOAD_HANDLER]);
        this.unloadListenerActive = false;
    }
    this.classesWrapper.fullPage = this.fullPage;
    this.tabs = this.getTabs();
  }

  ngOnChanges() {
    if (!this.blockReload && this.unloadListenerActive) {
        this.$window.removeEventListener('beforeunload', STATE.listeners[KEY_UNLOAD_HANDLER]);
        this.unloadListenerActive = false;
    }
    this.classesWrapper.fullPage = this.fullPage;
  }

  ngOnDestroy() {
    if (this.unloadListenerActive) {
        this.$window.removeEventListener('beforeunload', STATE.listeners[KEY_UNLOAD_HANDLER]);
    }
    this.$window.removeEventListener('click', STATE.listeners[KEY_SELECT_START_HANDLER]);
    this.$window.removeEventListener('click', STATE.listeners[KEY_SELECT_END_HANDLER]);
  }

  canDeactivate() {
    return new Observable<boolean>((observer: any) => {
      if(!this.unloadListenerActive) {
        observer.next(true);
        observer.complete();
        return;
      }
      this.plConfirm.show({
        header: 'Cancel Availability Changes',
        content: `
          <div style="padding-bottom:12px;">Are you sure you want to leave this page?</div>
          <div>You will lose any unsaved changes.</div>
        `,
        primaryLabel: 'Yes', secondaryLabel: 'No',
        primaryCallback: () => {
          observer.next(true);
          observer.complete();
        },
        secondaryCallback: () => {
          observer.next(false);
          observer.complete();
        },
        closeCallback: () => {
          observer.next(false);
          observer.complete();
        },
      });
    }).pipe(first());
  }

  onClickAgree() {
    this.hasAgreed = true;
    this.scrollFirstBusinessHourIntoView();
  }

  onClickDoneEnteringTime() {
    this.isDoneEnteringTime = true;
  }

  getTotalWorkingHours() {
    return Math.round(MODEL.maxHours * 1.25 * 2) / 2;
  }

  getTimeWithStudentsHours(totalWorkingHours: any) {
    return Math.round(totalWorkingHours * .8 * 2) / 2;
  }

  getTabs(): any[] {
    return [
        { label: 'Calendar', href: `/schedule`, replaceHistory: true },
        { label: 'Availability', href: `/availability`, replaceHistory: true },
        { label: 'Assignments', href: `/assignments`, replaceHistory: true },
    ];
  }

  get $window() {
    return this.windowObj;
  }

  set $window(obj: any) {
    this.windowObj = obj;
  }

  get model() {
    return MODEL;
  }

  get state() {
    return STATE;
  }
}

const WEEKDAYS = 'MTWRF';

// preferred business hours
const BUSINESS_HOURS = {
  '7:00 am': 1, '7:30 am': 1,
  '8:00 am': 1, '8:30 am': 1,
  '9:00 am': 1, '9:30 am': 1,
  '10:00 am': 1, '10:30 am': 1,
  '11:00 am': 1, '11:30 am': 1,
  '12:00 pm': 1, '12:30 pm': 1,
  '1:00 pm': 1, '1:30 pm': 1,
  '2:00 pm': 1, '2:30 pm': 1,
  '3:00 pm': 1, '3:30 pm': 1,
  '4:00 pm': 1, '4:30 pm': 1,
  '5:00 pm': 1, '5:30 pm': 1,
};

const GQL_GET_AVAILABILITY = `
  {
    availabilityPreference {
      maxWeeklyHours
      modified
    }
    availabilityBlocks {
      day
      start
      end
      uuid
      modified
    }
  }
`;

const GQL_SET_AVAILABILITY = `
  mutation SaveAvailabilityPreference($availabilityPreference: SetAvailabilityPreferenceInputData, $availabilityBlocks: [SetAvailabilityBlockInputData]) {
    setAvailabilityPreference(input: {availabilityPreference: $availabilityPreference, availabilityBlocks: $availabilityBlocks}) {
      errors {
        code
        message
        field
      }
      availabilityPreference {
        maxWeeklyHours
        modified
      }
      availabilityBlocks {
        day
        start
        end
        uuid
        modified
      }
    }
  }
`;

const GQL_GET_PROVIDER_AVAILABILITY = `
query getProviderAvailability($providerId: UUID){
  availabilityPreference {
    maxWeeklyHours
    modified
  }
  availabilityBlocks(providerId: $providerId) {
    day
    start
    end
    uuid
    modified
  }
}
`;

let MODEL:any, STATE:any, CONST:any;
