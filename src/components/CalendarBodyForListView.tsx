import dayjs from 'dayjs'
import * as React from 'react'
import { LayoutChangeEvent, Platform, SectionList, Text, View, ViewStyle } from 'react-native'

import { u } from '../commonStyles'
import { EventCellStyle, EventRenderer, ICalendarEvent } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { isToday, typedMemo } from '../utils'
import { CalendarEventForListView } from './CalendarEventForListView'

const ITEM_SPACING = 12

type ItemsHeight = {
  index: number
  height: number
}

type Event<T> = {
  dateString: string
  events: ICalendarEvent<T>[]
}

type EventGroup<T> = {
  title: string
  data: Event<T>[]
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
  scrollToDate,
  containerHeight,
  onEndReached,
  onEndReachedThreshold = 0.1,
}: CalendarBodyForMonthViewProps<T>) {
  const theme = useTheme()

  const sectionListRef = React.useRef<SectionList>(null)

  const itemsHeightRef = React.useRef<ItemsHeight[]>([]).current

  const primaryBg = { backgroundColor: theme.palette.primary.main }

  // Group events by month, and then by date
  const eventsGroupedByDay = React.useMemo(
    () =>
      events
        .sort((a, b) => {
          return a.start.getTime() - b.start.getTime()
        })
        .reduce((elements, event) => {
          const eventDate = dayjs(event.start)
          let element = elements.find((item) => item.title === eventDate.format('YYYY-MM'))

          if (!element) {
            const month = eventDate.format('YYYY-MM')

            element = { title: month, data: [] }
            elements.push(element)
          }

          let groupEvent = element.data.find(
            (el) => el.dateString === eventDate.format('YYYY-MM-DD'),
          )

          if (!groupEvent) {
            const data: Event<T> = { dateString: eventDate.format('YYYY-MM-DD'), events: [] }
            data.events.push(event)
            element.data.push(data)
          } else {
            groupEvent.events.push(event)
          }

          return elements
        }, [] as EventGroup<T>[]),
    [events],
  )

  React.useEffect(() => {
    if (scrollToDate) {
      const eventGroupIndex = eventsGroupedByDay.findIndex(
        (group) => group.title === dayjs(scrollToDate).format('YYYY-MM'),
      )
      if (eventGroupIndex !== -1) {
        const eventIndex = eventsGroupedByDay[eventGroupIndex].data.findIndex(
          (event) => event.dateString === dayjs(scrollToDate).format('YYYY-MM-DD'),
        )

        if (eventIndex !== -1) {
          setTimeout(() => {
            sectionListRef.current?.scrollToLocation({
              sectionIndex: eventGroupIndex,
              itemIndex: eventIndex,
              animated: true,
            })
          }, 300)
        }
      }
    }
  }, [eventsGroupedByDay, scrollToDate])

  const onLayoutItem = (event: LayoutChangeEvent, index: number) => {
    const height = event.nativeEvent.layout.height

    itemsHeightRef.push({ index, height })
  }

  const renderItem = (result: { item: Event<T>; index: number }) => {
    const dateString = result.item.dateString
    const date = dayjs(dateString)
    const _isToday = isToday(date)

    return (
      <View
        style={[u['flex-row'], { marginVertical: ITEM_SPACING }]}
        onLayout={(event) => onLayoutItem(event, result.index)}
      >
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
          {result.item.events.map((event: ICalendarEvent<T>, index: number) => {
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
      <SectionList
        ref={sectionListRef}
        keyExtractor={(item, index) => item.dateString + index}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        showsVerticalScrollIndicator={false}
        sections={eventsGroupedByDay}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[theme.typography.xl]}>{dayjs(title).format('MMM, YYYY')}</Text>
        )}
        getItemLayout={(_, index) => {
          const length =
            itemsHeightRef.length !== 0
              ? itemsHeightRef.find((item) => item.index === index)?.height
              : 0
          const offset = itemsHeightRef
            .slice(0, index)
            .reduce((a, c) => a + c.height + ITEM_SPACING * 2, 0)
          return { length: length ?? 0, offset, index }
        }}
      />
    </View>
  )
}

export const CalendarBodyForListView = typedMemo(_CalendarBodyForListView)
