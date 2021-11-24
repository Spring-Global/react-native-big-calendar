import calendarize from 'calendarize'
import dayjs from 'dayjs'
import * as React from 'react'
import {
  Dimensions,
  LayoutChangeEvent,
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
  events: ICalendarEvent<T>[]
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
  events,
  onPressEvent,
  eventCellStyle,
  onSwipeHorizontal,
  hideNowIndicator,
  renderEvent,
  maxVisibleEventCount,
  weekStartsOn,
}: CalendarBodyForMonthViewProps<T>) {
  const { now } = useNow(!hideNowIndicator)

  const panResponder = usePanResponder({
    onSwipeHorizontal,
  })

  const weeksCalendarized = calendarize(targetDate.toDate(), weekStartsOn)

  const minCellHeight = Dimensions.get('window').height / 7
  const theme = useTheme()

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

export const CalendarBodyForMonthView = typedMemo(_CalendarBodyForMonthView)
