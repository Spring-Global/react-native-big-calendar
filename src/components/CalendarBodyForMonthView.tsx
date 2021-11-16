import calendarize from 'calendarize'
import dayjs from 'dayjs'
import * as React from 'react'
import { Platform, ScrollView, Text, TouchableOpacity, View, ViewStyle } from 'react-native'

import { u } from '../commonStyles'
import { useNow } from '../hooks/useNow'
import { usePanResponder } from '../hooks/usePanResponder'
import {
  EventCellStyle,
  EventRenderer,
  HorizontalDirection,
  ICalendarEvent,
  WeekNum,
} from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { CalendarEventForMonthView } from './CalendarEventForMonthView'

interface CalendarBodyForMonthViewProps {
  containerHeight: number
  targetDate: dayjs.Dayjs
  events: ICalendarEvent[]
  style: ViewStyle
  eventCellStyle?: EventCellStyle
  hideNowIndicator?: boolean
  onPressCell?: (date: Date) => void
  onPressEvent?: (event: ICalendarEvent) => void
  onSwipeHorizontal?: (d: HorizontalDirection) => void
  renderEvent?: EventRenderer
  maxVisibleEventCount: number
  weekStartsOn: WeekNum
}

function _CalendarBodyForMonthView({
  containerHeight,
  targetDate,
  style,
  onPressCell,
  events,
  onPressEvent,
  eventCellStyle,
  onSwipeHorizontal,
  hideNowIndicator,
  renderEvent,
  maxVisibleEventCount,
  weekStartsOn,
}: CalendarBodyForMonthViewProps) {
  const { now } = useNow(!hideNowIndicator)

  const weeksCalendarized = calendarize(targetDate.toDate(), weekStartsOn)

  const minCellHeight = 190
  const theme = useTheme()

  const panResponder = usePanResponder({
    onSwipeHorizontal,
  })

  const weeksWithEvents = React.useMemo(
    () =>
      weeksCalendarized.map((week) => {
        const weekWithEvents = week.map((w) => {
          if (w === 0) {
            return null
          }

          const eventDate = dayjs(targetDate).set('date', w)

          const dayEvents = events
            .filter(({ start, end }) =>
              eventDate.isBetween(dayjs(start).startOf('day'), dayjs(end).endOf('day')),
            )
            .sort((a, b) => {
              if (dayjs(a.start).isSame(b.start, 'day')) {
                const aDuration = dayjs.duration(dayjs(a.end).diff(dayjs(a.start))).days()
                const bDuration = dayjs.duration(dayjs(b.end).diff(dayjs(b.start))).days()
                return bDuration - aDuration
              }
              return a.start.getTime() - b.start.getTime()
            })

          return {
            day: eventDate,
            events: dayEvents,
          }
        })

        return weekWithEvents
      }),
    [events, targetDate, weeksCalendarized],
  )

  return (
    <View
      style={[
        {
          height: containerHeight,
        },
        u['flex-column'],
        u['flex-1'],
        u['border-b'],
        u['border-l'],
        u['border-r'],
        u['rounded'],
        { borderColor: theme.palette.gray['200'] },
        style,
      ]}
      {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
    >
      <ScrollView
        style={u['flex-1']}
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
        showsVerticalScrollIndicator={false}
      >
        {weeksWithEvents.map((weeks, i) => (
          <View
            key={i}
            style={[
              u['flex-1'],
              theme.isRTL ? u['flex-row-reverse'] : u['flex-row'],
              Platform.OS === 'android' && style, // TODO: in Android, backgroundColor is not applied to child components
              {
                minHeight: minCellHeight,
              },
            ]}
          >
            {weeks.map((date, ii) => (
              <TouchableOpacity
                onPress={() => date && onPressCell && onPressCell(date.day.toDate())}
                style={[
                  i > 0 && u['border-t'],
                  theme.isRTL && ii > 0 && u['border-r'],
                  !theme.isRTL && ii > 0 && u['border-l'],
                  { borderColor: theme.palette.gray['200'] },
                  u['p-2'],
                  u['flex-1'],
                  u['flex-column'],
                  {
                    minHeight: minCellHeight,
                  },
                ]}
                key={`tapDay_${ii}_${date?.day.toISOString() ?? ''}`}
              >
                {date && (
                  <>
                    <Text
                      style={[
                        { textAlign: 'center' },
                        theme.typography.sm,
                        {
                          color:
                            date.day.format('YYYY-MM-DD') === now.format('YYYY-MM-DD')
                              ? theme.palette.primary.main
                              : theme.palette.gray['800'],
                        },
                      ]}
                    >
                      {date.day.format('D')}
                    </Text>
                    {date.events.reduce(
                      (elements, event, index, events) => [
                        ...elements,
                        index > maxVisibleEventCount ? null : index === maxVisibleEventCount ? (
                          <Text
                            key={`maxEvents_${event.start.toISOString()}_${index}`}
                            style={{ fontSize: 11, marginTop: 2, fontWeight: 'bold' }}
                          >
                            {events.length - maxVisibleEventCount} More
                          </Text>
                        ) : (
                          <CalendarEventForMonthView
                            key={`eventMonth_${event.start.toISOString()}_${index}`}
                            event={event}
                            eventCellStyle={eventCellStyle}
                            onPressEvent={onPressEvent}
                            renderEvent={renderEvent}
                            date={date.day}
                            dayOfTheWeek={ii}
                            calendarWidth={0}
                            isRTL={theme.isRTL}
                          />
                        ),
                      ],
                      [] as (null | JSX.Element)[],
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const areEqual = (prev: CalendarBodyForMonthViewProps, next: CalendarBodyForMonthViewProps) => {
  if (!prev.targetDate.isSame(next.targetDate)) {
    return false
  }
  if (JSON.stringify(prev.events) !== JSON.stringify(next.events)) {
    return false
  }
  if (JSON.stringify(prev.style) !== JSON.stringify(next.style)) {
    return false
  }
  if (prev.containerHeight !== next.containerHeight) {
    return false
  }
  if (prev.renderEvent !== next.renderEvent) {
    return false
  }
  if (prev.weekStartsOn !== next.weekStartsOn) {
    return false
  }
  return true
}

export const CalendarBodyForMonthView = React.memo(_CalendarBodyForMonthView, areEqual)
