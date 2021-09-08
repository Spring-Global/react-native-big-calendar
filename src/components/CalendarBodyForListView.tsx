import dayjs from 'dayjs'
import * as React from 'react'
import { Platform, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native'

import { u } from '../commonStyles'
import { useNow } from '../hooks/useNow'
import { EventCellStyle, EventRenderer, ICalendarEvent } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { getRelativeTopInDay, isToday, typedMemo } from '../utils'
import { CalendarEventForListView } from './CalendarEventForListView'

const styles = StyleSheet.create({
  nowIndicator: {
    position: 'absolute',
    zIndex: 10000,
    height: 2,
    width: '100%',
  },
})

interface CalendarBodyForMonthViewProps<T> {
  events: ICalendarEvent<T>[]
  ampm: boolean
  showTime: boolean
  style: ViewStyle
  eventCellStyle?: EventCellStyle<T>
  hideNowIndicator?: boolean
  onPressEvent?: (event: ICalendarEvent<T>) => void
  renderEvent?: EventRenderer<T>
}

function _CalendarBodyForListView<T>({
  style,
  events,
  onPressEvent,
  eventCellStyle,
  ampm,
  hideNowIndicator,
  renderEvent,
}: CalendarBodyForMonthViewProps<T>) {
  const scrollView = React.useRef<ScrollView>(null)
  const { now } = useNow(!hideNowIndicator)
  const theme = useTheme()

  const eventsGroupedByDay = events
    .sort((a, b) => {
      return a.start.getTime() - b.start.getTime()
    })
    .reduce((elements, event) => {
      if (!elements[dayjs(event.start).format('YYYY-MM-DD')])
        elements[dayjs(event.start).format('YYYY-MM-DD')] = []
      elements[dayjs(event.start).format('YYYY-MM-DD')].push(event)
      return elements
    }, {} as any)

  const primaryBg = { backgroundColor: theme.palette.primary.main }

  return (
    <ScrollView
      style={[
        {
          height: '100%',
        },
        style,
      ]}
      ref={scrollView}
      scrollEventThrottle={32}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <View style={[u['flex-1']]}>
        {Object.keys(eventsGroupedByDay).map((dateString) => {
          const date = dayjs(dateString)
          const _isToday = isToday(dayjs(dateString))

          return (
            <View key={dateString} style={[u['flex-row'], { marginVertical: 12 }]}>
              <View style={{ width: 60 }}>
                <Text
                  style={[
                    theme.typography.xs,
                    u['text-center'],
                    { color: _isToday ? theme.palette.primary.main : theme.palette.gray['500'] },
                  ]}
                >
                  {date.format('ddd')}
                </Text>
                <View
                  style={
                    _isToday
                      ? [
                          primaryBg,
                          u['h-36'],
                          u['w-36'],
                          u['pb-6'],
                          u['rounded-full'],
                          u['items-center'],
                          u['justify-center'],
                          u['self-center'],
                          u['z-20'],
                        ]
                      : [u['mb-6']]
                  }
                >
                  <Text
                    style={[
                      {
                        color: _isToday
                          ? theme.palette.primary.contrastText
                          : theme.palette.gray['800'],
                      },
                      theme.typography.xl,
                      u['text-center'],
                      Platform.OS === 'web' && _isToday && u['mt-6'],
                    ]}
                  >
                    {date.format('D')}
                  </Text>
                </View>
              </View>

              <View style={[u['flex-1']]}>
                {eventsGroupedByDay[dateString].map((event: ICalendarEvent<T>, index: number) => {
                  return (
                    <CalendarEventForListView
                      key={index}
                      ampm={ampm}
                      isRTL={theme.isRTL}
                      event={event}
                      eventCellStyle={eventCellStyle}
                      onPressEvent={onPressEvent}
                      renderEvent={renderEvent}
                    />
                  )
                })}
              </View>
              {isToday(dayjs(dateString)) && !hideNowIndicator && (
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

export const CalendarBodyForListView = typedMemo(_CalendarBodyForListView)
