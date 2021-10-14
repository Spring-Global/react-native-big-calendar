import dayjs from 'dayjs'
import * as React from 'react'
import {
  DefaultSectionT,
  LayoutChangeEvent,
  Platform,
  SectionList,
  SectionListData,
  Text,
  TextStyle,
  View,
  ViewStyle,
  ViewToken,
} from 'react-native'

import { u } from '../commonStyles'
import { EventCellStyle, EventRenderer, ICalendarEvent } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { isToday, typedMemo } from '../utils'
import { CalendarEventForListView } from './CalendarEventForListView'

const ITEM_SPACING = 12

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
  listMonthSectionTextStyle?: TextStyle
  listGetCurrentSection?: (currentSection: string) => void
  listStickySectionHeadersEnabled?: boolean
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
  listMonthSectionTextStyle,
  listGetCurrentSection,
  listStickySectionHeadersEnabled = true,
}: CalendarBodyForMonthViewProps<T>) {
  const theme = useTheme()
  const [headerHeight, setHeaderHeight] = React.useState(46)

  const sectionListRef = React.useRef<SectionList>(null)

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
              itemIndex: eventIndex + 1,
              animated: true,
            })
          }, 300)
        }
      }
    }
  }, [eventsGroupedByDay, scrollToDate])

  const onCheckViewableItems = React.useCallback(
    (info: { viewableItems: Array<ViewToken>; changed: Array<ViewToken> }) => {
      if (info.changed) {
        const currentSectionObject = info.viewableItems[0]
        if (currentSectionObject && listGetCurrentSection) {
          listGetCurrentSection(currentSectionObject.section.title)
        }
      }
    },
    [listGetCurrentSection],
  )

  const getHeaderHeight = React.useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height
    setHeaderHeight(height)
  }, [])

  const renderSectionHeader = (info: { section: SectionListData<Event<T>, DefaultSectionT> }) => {
    return (
      <View
        style={{ width: '100%', backgroundColor: '#fff', paddingVertical: 8, paddingLeft: 16 }}
        onLayout={getHeaderHeight}
      >
        <Text style={[theme.typography.xl, { ...listMonthSectionTextStyle }]}>
          {dayjs(info.section.title).format('MMM, YYYY')}
        </Text>
      </View>
    )
  }

  const renderItem = React.useCallback(
    (result: { item: Event<T> }) => {
      const dateString = result.item.dateString
      const date = dayjs(dateString)
      const _isToday = isToday(date)
      let overlapIndex = -1

      return (
        <View style={[u['flex-row'], { marginVertical: ITEM_SPACING }]}>
          <View style={{ width: 60 }}>
            <Text
              style={[
                theme.typography.xs,
                u['text-center'],
                { color: _isToday ? theme.palette.primary.main : theme.palette.gray['500'] },
                {
                  ...(_isToday
                    ? theme.customStyles?.dateHeaderTodayDayText
                    : theme.customStyles?.dateHeaderDayText),
                },
              ]}
            >
              {date.format('ddd')}
            </Text>
            <View
              style={
                _isToday
                  ? [
                      {
                        backgroundColor: theme.palette.primary.main,
                      },
                      u['h-36'],
                      u['w-36'],
                      u['pb-6'],
                      u['rounded-full'],
                      u['items-center'],
                      u['justify-center'],
                      u['self-center'],
                      u['z-20'],
                      theme.customStyles?.dateHeaderTodayContainer,
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
                  {
                    ...(_isToday
                      ? theme.customStyles?.dateHeaderTodayText
                      : theme.customStyles?.dateHeaderText),
                  },
                ]}
              >
                {date.format('D')}
              </Text>
            </View>
          </View>

          <View style={[u['flex-1']]}>
            {result.item.events.map((event: ICalendarEvent<T>, index: number) => {
              let isOverlap = false
              const itemsFiltered = result.item.events.filter(
                (ev) => JSON.stringify(ev) !== JSON.stringify(event),
              )
              const overlapEvent = itemsFiltered.some(
                (ev) =>
                  dayjs(ev.start).format('YYYY-MM-DDTHH:mm') ===
                  dayjs(event.start).format('YYYY-MM-DDTHH:mm'),
              )
              if (overlapEvent) {
                isOverlap = true
                overlapIndex++
              } else {
                overlapIndex = -1
              }

              return (
                <CalendarEventForListView
                  key={index}
                  ampm={ampm}
                  isRTL={theme.isRTL}
                  event={event}
                  eventCellStyle={eventCellStyle}
                  onPressEvent={onPressEvent}
                  renderEvent={renderEvent}
                  isOverlap={isOverlap}
                  index={overlapIndex}
                />
              )
            })}
          </View>
        </View>
      )
    },
    [
      ampm,
      eventCellStyle,
      onPressEvent,
      renderEvent,
      theme.customStyles?.dateHeaderDayText,
      theme.customStyles?.dateHeaderText,
      theme.customStyles?.dateHeaderTodayContainer,
      theme.customStyles?.dateHeaderTodayDayText,
      theme.customStyles?.dateHeaderTodayText,
      theme.isRTL,
      theme.palette.gray,
      theme.palette.primary.contrastText,
      theme.palette.primary.main,
      theme.typography.xl,
      theme.typography.xs,
    ],
  )

  return (
    <View style={Platform.OS === 'web' ? { height: containerHeight - headerHeight } : u['flex-1']}>
      <SectionList
        ref={sectionListRef}
        keyExtractor={(item, index) => item.dateString + index}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        showsVerticalScrollIndicator={false}
        sections={eventsGroupedByDay}
        stickySectionHeadersEnabled={listStickySectionHeadersEnabled}
        renderSectionHeader={renderSectionHeader}
        onViewableItemsChanged={onCheckViewableItems}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 10,
        }}
        onScrollToIndexFailed={() => {
          sectionListRef.current?.scrollToLocation({
            animated: false,
            itemIndex: 0,
            sectionIndex: 0,
          })
        }}
      />
    </View>
  )
}

export const CalendarBodyForListView = typedMemo(_CalendarBodyForListView)
