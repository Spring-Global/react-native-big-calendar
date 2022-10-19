import dayjs from 'dayjs'
import * as React from 'react'
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native'

import { u } from '../commonStyles'
import { useNow } from '../hooks/useNow'
import { usePanResponder } from '../hooks/usePanResponder'
import { EventCellStyle, EventRenderer, HorizontalDirection, ICalendarEvent } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import {
  getCountOfEventsAtEvent,
  getOrderOfEvent,
  getRelativeTopInDay,
  hours,
  isToday,
  typedMemo,
} from '../utils'
import { CalendarEvent } from './CalendarEvent'
import { HourGuideCell } from './HourGuideCell'
import { HourGuideColumn } from './HourGuideColumn'

const styles = StyleSheet.create({
  nowIndicator: {
    position: 'absolute',
    zIndex: 10000,
    height: 2,
    width: '100%',
  },
})

interface CalendarBodyProps<T> {
  cellHeight: number
  containerHeight: number
  dateRange: dayjs.Dayjs[]
  scrollOffsetMinutes: number
  ampm: boolean
  showTime: boolean
  style: ViewStyle
  eventCellStyle?: EventCellStyle<T>
  hideNowIndicator?: boolean
  overlapOffset?: number
  onPressCell?: (date: Date) => void
  onPressEvent?: (event: ICalendarEvent<T>) => void
  onSwipeHorizontal?: (d: HorizontalDirection) => void
  renderEvent?: EventRenderer<T>
  dayEventsHash: Map<number | string, ICalendarEvent<T>[]>
}

function _CalendarBody<T>({
  containerHeight,
  cellHeight,
  dateRange,
  style,
  onPressCell,
  onPressEvent,
  eventCellStyle,
  ampm,
  showTime,
  scrollOffsetMinutes,
  onSwipeHorizontal,
  hideNowIndicator,
  overlapOffset,
  renderEvent,
  dayEventsHash,
}: CalendarBodyProps<T>) {
  const scrollView = React.useRef<ScrollView>(null)
  const { now } = useNow(!hideNowIndicator)

  let eventsThisDate: ICalendarEvent<T>[] = []
  let eventsEndsThisDate: ICalendarEvent<T>[] = []
  let eventsBeforeAndAfterThisDate: ICalendarEvent<T>[] = []

  React.useEffect(() => {
    if (scrollView.current && scrollOffsetMinutes != null) {
      // We add delay here to work correct on React Native
      // see: https://stackoverflow.com/questions/33208477/react-native-android-scrollview-scrollto-not-working
      setTimeout(
        () => {
          if (scrollView && scrollView.current) {
            scrollView.current.scrollTo({
              y: (cellHeight * scrollOffsetMinutes) / 60,
              animated: false,
            })
          }
        },
        Platform.OS === 'web' ? 0 : 10,
      )
    }
  }, [scrollView, scrollOffsetMinutes, cellHeight])

  const panResponder = usePanResponder({
    onSwipeHorizontal,
  })

  const _onPressCell = React.useCallback(
    (date: dayjs.Dayjs) => {
      onPressCell && onPressCell(date.toDate())
    },
    [onPressCell],
  )

  const _renderMappedEvent = (event: ICalendarEvent<T>) => {
    const events = [...eventsThisDate, ...eventsEndsThisDate, ...eventsBeforeAndAfterThisDate]

    return (
      <CalendarEvent
        key={`${event.start.toISOString()}${event.title}${event.end.toISOString()}`}
        event={event}
        onPressEvent={onPressEvent}
        eventCellStyle={eventCellStyle}
        showTime={showTime}
        overlapOffset={overlapOffset}
        renderEvent={renderEvent}
        ampm={ampm}
        eventCount={getCountOfEventsAtEvent(event, events)}
        eventOrder={getOrderOfEvent(event, events)}
      />
    )
  }

  const theme = useTheme()

  return (
    <ScrollView
      style={[
        {
          height: containerHeight - cellHeight * 1,
        },
        style,
      ]}
      ref={scrollView}
      scrollEventThrottle={32}
      {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      contentOffset={Platform.OS === 'ios' ? { x: 0, y: scrollOffsetMinutes } : { x: 0, y: 0 }}
    >
      <View style={[u['flex-1'], theme.isRTL ? u['flex-row-reverse'] : u['flex-row']]}>
        <View style={[u['z-20'], u['w-50']]}>
          {hours.map((hour) => (
            <HourGuideColumn key={hour} cellHeight={cellHeight} hour={hour} ampm={ampm} />
          ))}
        </View>
        {dateRange.map((date) => {
          const dateKey = date.format('MM/DD/YYYY')
          eventsThisDate = dayEventsHash.get(`${dateKey}_this-date`) || []
          eventsEndsThisDate = dayEventsHash.get(`${dateKey}_ends-this-date`) || []
          eventsBeforeAndAfterThisDate =
            dayEventsHash.get(`${dateKey}_before-and-after-this-date`) || []

          return (
            <View style={[u['flex-1'], u['overflow-hidden']]} key={date.toString()}>
              {hours.map((hour) => (
                <HourGuideCell
                  key={hour}
                  cellHeight={cellHeight}
                  date={date}
                  hour={hour}
                  onPress={_onPressCell}
                />
              ))}

              {/* Render events of this date */}
              {/* M  T  (W)  T  F  S  S */}
              {/*       S-E             */}
              {eventsThisDate.map(_renderMappedEvent)}

              {/* Render events which starts before this date and ends on this date */}
              {/* M  T  (W)  T  F  S  S */}
              {/* S------E              */}
              {eventsEndsThisDate.map(_renderMappedEvent)}

              {/* Render events which starts before this date and ends after this date */}
              {/* M  T  (W)  T  F  S  S */}
              {/*    S-------E          */}
              {eventsBeforeAndAfterThisDate.map(_renderMappedEvent)}

              {isToday(date) && !hideNowIndicator && (
                <View
                  style={[
                    styles.nowIndicator,
                    { backgroundColor: theme.palette.nowIndicator },
                    { top: `${getRelativeTopInDay(now)}%` },
                  ]}
                />
              )}
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

export const CalendarBody = typedMemo(_CalendarBody)
