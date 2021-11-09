import { Week } from 'calendarize'
import dayjs from 'dayjs'
import React from 'react'
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
import { EventCellStyle, EventRenderer, ICalendarEvent } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { typedMemo } from '../utils'
import { CalendarEventForMonthView } from './CalendarEventForMonthView'

interface CalendarMonthListItemProps<T> {
  style: ViewStyle
  weeks: Week[]
  targetDate: dayjs.Dayjs
  onPressCell?: (date: Date) => void
  hideNowIndicator?: boolean
  events: ICalendarEvent<T>[]
  maxVisibleEventCount: number
  eventCellStyle?: EventCellStyle<T>
  onPressEvent?: (event: ICalendarEvent<T>) => void
  renderEvent?: EventRenderer<T>
}

const minCellHeight = 190

function _CalendarMonthListItem<T>({
  style,
  weeks,
  targetDate,
  onPressCell,
  hideNowIndicator,
  events,
  maxVisibleEventCount,
  eventCellStyle,
  onPressEvent,
  renderEvent,
}: CalendarMonthListItemProps<T>) {
  const theme = useTheme()
  const { now } = useNow(!hideNowIndicator)

  return (
    <View
      style={[
        u['flex-column'],
        u['border-b'],
        u['border-l'],
        u['border-r'],
        u['rounded'],
        { borderColor: theme.palette.gray['200'], width: Dimensions.get('window').width },
        style,
      ]}
    >
      <ScrollView
        style={u['flex-1']}
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
        showsVerticalScrollIndicator={false}
      >
        {weeks.map((week, i) => (
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
            {week
              .map((d) => (d > 0 ? targetDate.date(d) : null))
              .map((date, ii) => (
                <TouchableOpacity
                  onPress={() => date && onPressCell && onPressCell(date.toDate())}
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
                  key={ii}
                >
                  <Text
                    style={[
                      { textAlign: 'center' },
                      theme.typography.sm,
                      {
                        color:
                          date?.format('YYYY-MM-DD') === now.format('YYYY-MM-DD')
                            ? theme.palette.primary.main
                            : theme.palette.gray['800'],
                      },
                    ]}
                  >
                    {date && date.format('D')}
                  </Text>
                  {date &&
                    events
                      .filter(({ start, end }) =>
                        date.isBetween(
                          dayjs(start).startOf('day'),
                          dayjs(end).endOf('day'),
                          null,
                          '[)',
                        ),
                      )
                      .sort((a, b) => {
                        if (dayjs(a.start).isSame(b.start, 'day')) {
                          const aDuration = dayjs.duration(dayjs(a.end).diff(dayjs(a.start))).days()
                          const bDuration = dayjs.duration(dayjs(b.end).diff(dayjs(b.start))).days()
                          return bDuration - aDuration
                        }
                        return a.start.getTime() - b.start.getTime()
                      })
                      .reduce(
                        (elements, event, index, events) => [
                          ...elements,
                          index > maxVisibleEventCount ? null : index === maxVisibleEventCount ? (
                            <Text
                              key={index}
                              style={{ fontSize: 11, marginTop: 2, fontWeight: 'bold' }}
                            >
                              {events.length - maxVisibleEventCount} More
                            </Text>
                          ) : (
                            <CalendarEventForMonthView
                              key={index}
                              event={event}
                              eventCellStyle={eventCellStyle}
                              onPressEvent={onPressEvent}
                              renderEvent={renderEvent}
                              date={date}
                              dayOfTheWeek={ii}
                              calendarWidth={Dimensions.get('window').width}
                              isRTL={theme.isRTL}
                            />
                          ),
                        ],
                        [] as (null | JSX.Element)[],
                      )}
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

export const CalendarMonthListItem = typedMemo(_CalendarMonthListItem)
