import dayjs from 'dayjs'
import * as React from 'react'
import { FlatList, Platform, Text, View, ViewStyle } from 'react-native'

import { u } from '../commonStyles'
import { EventCellStyle, EventRenderer, ICalendarEvent } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { isToday, typedMemo } from '../utils'
import { CalendarEventForListView } from './CalendarEventForListView'

const ITEM_SPACING = 12

interface EventGroup<T> {
  dateString: string
  data: ICalendarEvent<T>[]
}

interface CalendarBodyForMonthViewProps<T> {
  events: ICalendarEvent<T>[]
  ampm: boolean
  showTime: boolean
  style: ViewStyle
  eventCellStyle?: EventCellStyle<T>
  onPressEvent?: (event: ICalendarEvent<T>) => void
  renderEvent?: EventRenderer<T>
  scrollToDate?: Date
  cellHeight: number
  containerHeight: number
  onEndReached?: ((info: { distanceFromEnd: number }) => void) | null | undefined
  onEndReachedThreshold?: number | null | undefined
}

function _CalendarBodyForListView<T>({
  events,
  onPressEvent,
  eventCellStyle,
  ampm,
  renderEvent,
  cellHeight,
  scrollToDate,
  containerHeight,
  onEndReached,
  onEndReachedThreshold = 0.1,
}: CalendarBodyForMonthViewProps<T>) {
  const theme = useTheme()

  const flatListRef = React.useRef<FlatList>(null)

  const eventsGroupedByDay = events
    .sort((a, b) => {
      return a.start.getTime() - b.start.getTime()
    })
    .reduce((elements, event) => {
      let element = elements.find(
        (item) => item.dateString === dayjs(event.start).format('YYYY-MM-DD'),
      )

      if (!element) {
        element = { dateString: dayjs(event.start).format('YYYY-MM-DD'), data: [] }
        elements.push(element)
      }

      element.data.push(event)

      return elements
    }, [] as EventGroup<T>[])

  React.useEffect(() => {
    if (scrollToDate) {
      const eventIndex = eventsGroupedByDay.findIndex(
        (event) => event.dateString === dayjs(scrollToDate).format('YYYY-MM-DD'),
      )
      flatListRef.current?.scrollToIndex({ index: eventIndex, animated: false })
    }
  }, [scrollToDate, eventsGroupedByDay])

  const primaryBg = { backgroundColor: theme.palette.primary.main }

  const renderItem = (result: { item: EventGroup<T> }) => {
    const dateString = result.item.dateString
    const date = dayjs(dateString)
    const _isToday = isToday(date)

    return (
      <View style={[u['flex-row'], { marginVertical: ITEM_SPACING }]}>
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
                  color: _isToday ? theme.palette.primary.contrastText : theme.palette.gray['800'],
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
          {result.item.data.map((event: ICalendarEvent<T>, index: number) => {
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
      </View>
    )
  }

  return (
    <View style={{ height: containerHeight }}>
      <FlatList
        ref={flatListRef}
        keyExtractor={(item) => item.dateString}
        data={eventsGroupedByDay}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: data![index].data.length * (cellHeight + ITEM_SPACING * 2),
          offset: data![index].data.length * (cellHeight + ITEM_SPACING * 2) * index,
          index,
        })}
      />
    </View>
  )
}

export const CalendarBodyForListView = typedMemo(_CalendarBodyForListView)
