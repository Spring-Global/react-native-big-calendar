import calendarize from 'calendarize'
import dayjs from 'dayjs'
import * as React from 'react'
import {
  Dimensions,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

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
import { typedMemo } from '../utils'
import { CalendarEventForMonthView } from './CalendarEventForMonthView'

interface CalendarBodyForMonthViewProps<T> {
  containerHeight: number
  targetDate: dayjs.Dayjs
  dayEventsHash: Map<string, ICalendarEvent<T>[]>
  style: ViewStyle
  eventCellStyle?: EventCellStyle<T>
  hideNowIndicator?: boolean
  onPressCell?: (date: Date) => void
  onPressEvent?: (event: ICalendarEvent<T>) => void
  onSwipeHorizontal?: (d: HorizontalDirection) => void
  renderEvent?: EventRenderer<T>
  maxVisibleEventCount: number
  weekStartsOn: WeekNum
}

function _CalendarBodyForMonthView<T>({
  containerHeight,
  targetDate,
  style,
  onPressCell,
  onPressEvent,
  eventCellStyle,
  onSwipeHorizontal,
  hideNowIndicator,
  renderEvent,
  maxVisibleEventCount,
  weekStartsOn,
  dayEventsHash,
}: CalendarBodyForMonthViewProps<T>) {
  const { now } = useNow(!hideNowIndicator)

  const panResponder = usePanResponder({
    onSwipeHorizontal,
  })

  const weeksCalendarized = calendarize(targetDate.toDate(), weekStartsOn)

  const minCellHeight = Dimensions.get('window').height / (weeksCalendarized.length + 1)
  const theme = useTheme()

  const weeksWithEvents = weeksCalendarized.map((week) => {
    const weekWithEvents = week.map((w) => {
      if (w === 0) {
        return null
      }

      const eventDate = dayjs(targetDate).set('date', w).startOf('day')
      const dayEvents = dayEventsHash.get(eventDate.toString()) || new Array<ICalendarEvent<T>>()

      const components: any[] = []
      for (let i = 0; i < Math.min(maxVisibleEventCount, dayEvents.length); i++) {
        const event = dayEvents[i]
        components.push(
          <CalendarEventForMonthView
            key={`eventMonth_${event.start.toISOString()}_${i}`}
            event={event}
            eventCellStyle={eventCellStyle}
            onPressEvent={onPressEvent}
            renderEvent={renderEvent}
            date={eventDate}
            dayOfTheWeek={w}
            calendarWidth={0}
            isRTL={theme.isRTL}
          />,
        )
      }

      if (dayEvents.length > maxVisibleEventCount) {
        components.push(
          <Text
            key={`maxEvents_${eventDate.toISOString()}`}
            style={{ fontSize: 11, marginTop: 2, fontWeight: 'bold' }}
          >
            {dayEvents.length - maxVisibleEventCount} More
          </Text>,
        )
      }

      return {
        day: eventDate,
        events: dayEvents,
        components,
      }
    })

    return weekWithEvents
  })

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
    >
      <ScrollView
        style={u['flex-1']}
        {...panResponder.panHandlers}
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

                    {/* Render events */}
                    {date.components}
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

export const CalendarBodyForMonthView = typedMemo(_CalendarBodyForMonthView)
