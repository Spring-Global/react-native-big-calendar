import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import React from 'react'
import { TextStyle, ViewStyle } from 'react-native'

import { MIN_HEIGHT } from '../commonStyles'
import {
  EventCellStyle,
  EventRenderer,
  HeaderRenderer,
  HorizontalDirection,
  ICalendarEvent,
  Mode,
  MonthHeaderRenderer,
  WeekNum,
} from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import {
  getDatesInMonth,
  getDatesInNextCustomDays,
  getDatesInNextOneDay,
  getDatesInNextThreeDays,
  getDatesInWeek,
  getOrderOfEvent,
  modeToNum,
  typedMemo,
} from '../utils'
import { CalendarBody } from './CalendarBody'
import { CalendarBodyForListView } from './CalendarBodyForListView'
import { CalendarBodyForMonthView } from './CalendarBodyForMonthView'
import { CalendarHeader } from './CalendarHeader'
import { CalendarHeaderForMonthView } from './CalendarHeaderForMonthView'

export interface CalendarContainerProps<T> {
  /**
   * Events to be rendered. This is a required prop.
   */
  events: ICalendarEvent<T>[]

  /**
   * The height of calendar component. This is a required prop.
   */
  height: number

  /**
   * Adjusts the indentation of events that occur during the same time period. Defaults to 20 on web and 8 on mobile.
   */
  overlapOffset?: number

  // Custom style
  eventCellStyle?: EventCellStyle<T>
  calendarContainerStyle?: ViewStyle
  headerContainerStyle?: ViewStyle
  bodyContainerStyle?: ViewStyle

  /**
   * Styles for the month section header on list visualization
   */
  listMonthSectionTextStyle?: TextStyle

  // Custom renderer
  renderEvent?: EventRenderer<T>
  renderHeader?: HeaderRenderer<T>
  renderHeaderForMonthView?: MonthHeaderRenderer

  ampm?: boolean
  date?: Date
  locale?: string
  hideNowIndicator?: boolean
  mode?: Mode
  scrollOffsetMinutes?: number
  showTime?: boolean

  swipeEnabled?: boolean
  weekStartsOn?: WeekNum
  onChangeDate?: (date: Date) => void
  onPressCell?: (date: Date) => void
  onPressDateHeader?: (date: Date) => void
  onPressEvent?: (event: ICalendarEvent<T>) => void
  weekEndsOn?: WeekNum
  maxVisibleEventCount?: number

  /**
   * Custom calendar row height.
   */
  cellHeight?: number

  /**
   * Calendar header row height.
   */
  headerCellHeight?: number

  /**
   * Scroll to especific date on list visualization mode.
   */
  scrollToDate?: Date

  /**
   * SectionList callback `onEndReached` for list visualization mode.
   */
  listOnEndReached?: ((info: { distanceFromEnd: number }) => void) | null | undefined

  /**
   * SectionList callback `onEndReachedThreshold` for list visualization mode. Default: `0.1`
   */
  listOnEndReachedThreshold?: number | null | undefined

  /**
   * Return the current section title for list visualization mode.
   */
  listGetCurrentSection?: (currentSection: string) => void

  /**
   * Enable the sticky headers on list visualization SectionList. Default: true
   */
  listStickySectionHeadersEnabled?: boolean

  /**
   * If enabled the current month text will be shown on the header.
   */
  showMonthOnHeader?: boolean

  selectedItem?: any
}

dayjs.extend(isBetween)

function _CalendarContainer<T>({
  events,
  height,
  ampm = false,
  date,
  eventCellStyle,
  locale = 'en',
  hideNowIndicator = false,
  mode = 'week',
  overlapOffset,
  scrollOffsetMinutes = 0,
  showTime = true,
  headerContainerStyle = {},
  bodyContainerStyle = {},
  swipeEnabled = true,
  weekStartsOn = 0,
  onChangeDate,
  onPressCell,
  onPressDateHeader,
  onPressEvent,
  renderEvent,
  renderHeader: HeaderComponent = CalendarHeader,
  renderHeaderForMonthView: HeaderComponentForMonthView = CalendarHeaderForMonthView,
  weekEndsOn = 6,
  maxVisibleEventCount = 3,
  cellHeight,
  headerCellHeight,
  scrollToDate,
  listMonthSectionTextStyle,
  listOnEndReached,
  listOnEndReachedThreshold,
  listGetCurrentSection,
  listStickySectionHeadersEnabled,
  showMonthOnHeader,
  selectedItem,
}: CalendarContainerProps<T>) {
  const targetDate = dayjs(date)

  const allDayEvents: ICalendarEvent<T>[] = [] //React.useMemo(
  //   () => events.filter((event) => isAllDayEvent(event.start, event.end)),
  //   [events],
  // )

  const daytimeEvents: ICalendarEvent<T>[] = [] //React.useMemo(
  //   () => events.filter((event) => !isAllDayEvent(event.start, event.end)),
  //   [events],
  // )

  const dateRange = React.useMemo(() => {
    switch (mode) {
      case 'month':
      case 'list':
        return getDatesInMonth(targetDate, locale)
      case 'week':
        return getDatesInWeek(targetDate, weekStartsOn, locale)
      case '3days':
        return getDatesInNextThreeDays(targetDate, locale)
      case 'day':
        return getDatesInNextOneDay(targetDate, locale)
      case 'custom':
        return getDatesInNextCustomDays(targetDate, weekStartsOn, weekEndsOn, locale)
      default:
        throw new Error(
          `[react-native-big-calendar] The mode which you specified "${mode}" is not supported.`,
        )
    }
  }, [mode, targetDate, locale, weekEndsOn, weekStartsOn])

  // Performance optimizations for rendering events on calendar. This will load all the expensive filters and sorts
  // for the events
  const dateRangeStr = JSON.stringify(dateRange)
  const dayEventsHash = React.useMemo(() => {
    const hash = new Map<number | string, ICalendarEvent<T>[]>()

    events.forEach((event) => {
      const startDayJs = dayjs(event.start)
      // const endtDayJs = dayjs(event.end)
      const key = startDayJs.startOf('day').valueOf()

      let dayEvents = hash.get(key)
      if (dayEvents == null) {
        dayEvents = []
        hash.set(key, dayEvents)
      }
      dayEvents.push(event)

      if (mode !== 'month') {
        dateRange.forEach((date) => {
          const thisDateCondition = dayjs(event.start).isBetween(
            date.startOf('day'),
            date.endOf('day'),
            null,
            '[)',
          )
          const endsThisDateCondition =
            dayjs(event.start).isBefore(date.startOf('day')) &&
            dayjs(event.end).isBetween(date.startOf('day'), date.endOf('day'), null, '[)')
          const beforeAndAfterThisDateCondition =
            dayjs(event.start).isBefore(date.startOf('day')) &&
            dayjs(event.end).isAfter(date.endOf('day'))

          const dateKey = date.format('MM/DD/YYYY')

          let eventsThisDateHash = hash.get(`${dateKey}_this-date`)
          let eventsEndsThisDateHash = hash.get(`${dateKey}_ends-this-date`)
          let eventsBeforeAndAfterThisDateHash = hash.get(`${dateKey}_before-and-after-this-date`)
          if (eventsThisDateHash == null) {
            eventsThisDateHash = []
            hash.set(`${dateKey}_this-date`, eventsThisDateHash)
          }
          if (eventsEndsThisDateHash == null) {
            eventsEndsThisDateHash = []
            hash.set(`${dateKey}_ends-this-date`, eventsEndsThisDateHash)
          }
          if (eventsBeforeAndAfterThisDateHash == null) {
            eventsBeforeAndAfterThisDateHash = []
            hash.set(`${dateKey}_before-and-after-this-date`, eventsBeforeAndAfterThisDateHash)
          }

          if (thisDateCondition) {
            const eventOrder = getOrderOfEvent(event, events)
            event.eventOrder = eventOrder
            eventsThisDateHash.push(event)
          } else if (endsThisDateCondition) {
            event.start = dayjs(event.end).startOf('day').toDate()
            const eventOrder = getOrderOfEvent(event, events)
            event.eventOrder = eventOrder
            eventsEndsThisDateHash.push(event)
          } else if (beforeAndAfterThisDateCondition) {
            event.start = dayjs(event.end).startOf('day').toDate()
            event.end = dayjs(event.end).endOf('day').toDate()
            const eventOrder = getOrderOfEvent(event, events)
            event.eventOrder = eventOrder
            eventsBeforeAndAfterThisDateHash.push(event)
          }
        })
      }
    })

    return hash
  }, [
    dateRangeStr,
    JSON.stringify(events),
    mode,
  ]) /* eslint-disable-line react-hooks/exhaustive-deps */

  const _cellHeight = React.useMemo(
    () => (cellHeight ? cellHeight : Math.max(height - 30, MIN_HEIGHT) / 24),
    [height, cellHeight],
  )

  const theme = useTheme()

  const onSwipeHorizontal = React.useCallback(
    (direction: HorizontalDirection) => {
      if (!swipeEnabled) {
        return
      }
      if (onChangeDate) {
        if ((direction === 'LEFT' && !theme.isRTL) || (direction === 'RIGHT' && theme.isRTL)) {
          onChangeDate(targetDate.add(modeToNum(mode, targetDate), 'day').toDate())
        } else {
          onChangeDate(targetDate.add(modeToNum(mode, targetDate) * -1, 'day').toDate())
        }
      }
    },
    [swipeEnabled, onChangeDate, theme.isRTL, targetDate, mode],
  )

  const commonProps = {
    cellHeight: _cellHeight,
    dateRange,
    mode,
  }

  if (mode === 'list') {
    return (
      <CalendarBodyForListView<T>
        {...commonProps}
        style={bodyContainerStyle}
        events={daytimeEvents}
        eventCellStyle={eventCellStyle}
        ampm={ampm}
        showTime={showTime}
        onPressEvent={onPressEvent}
        renderEvent={renderEvent}
        containerHeight={height}
        scrollToDate={scrollToDate}
        listMonthSectionTextStyle={listMonthSectionTextStyle}
        onEndReached={listOnEndReached}
        onEndReachedThreshold={listOnEndReachedThreshold}
        listGetCurrentSection={listGetCurrentSection}
        listStickySectionHeadersEnabled={listStickySectionHeadersEnabled}
        selectedItem={selectedItem}
      />
    )
  }

  if (mode === 'month') {
    const headerProps = {
      style: headerContainerStyle,
      locale: locale,
      weekStartsOn: weekStartsOn,
    }
    return (
      <React.Fragment>
        <HeaderComponentForMonthView {...headerProps} />
        <CalendarBodyForMonthView<T>
          {...commonProps}
          dayEventsHash={dayEventsHash}
          style={bodyContainerStyle}
          containerHeight={height}
          eventCellStyle={eventCellStyle}
          weekStartsOn={weekStartsOn}
          hideNowIndicator={hideNowIndicator}
          onPressCell={onPressCell}
          onPressEvent={onPressEvent}
          onSwipeHorizontal={onSwipeHorizontal}
          renderEvent={renderEvent}
          targetDate={targetDate}
          maxVisibleEventCount={maxVisibleEventCount}
        />
      </React.Fragment>
    )
  }

  const headerProps = {
    ...commonProps,
    style: headerContainerStyle,
    allDayEvents: allDayEvents,
    onPressDateHeader: onPressDateHeader,
    headerCellHeight,
  }

  return (
    <React.Fragment>
      <HeaderComponent showMonthOnHeader={showMonthOnHeader} {...headerProps} />
      <CalendarBody
        {...commonProps}
        style={bodyContainerStyle}
        containerHeight={height}
        eventCellStyle={eventCellStyle}
        hideNowIndicator={hideNowIndicator}
        overlapOffset={overlapOffset}
        scrollOffsetMinutes={scrollOffsetMinutes}
        ampm={ampm}
        showTime={showTime}
        onPressCell={onPressCell}
        onPressEvent={onPressEvent}
        onSwipeHorizontal={onSwipeHorizontal}
        renderEvent={renderEvent}
        dayEventsHash={dayEventsHash}
      />
    </React.Fragment>
  )
}

export const CalendarContainer = typedMemo(_CalendarContainer)
