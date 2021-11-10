import dayjs from 'dayjs'
import * as React from 'react'
import {
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

export type ListCalendarEvent = ICalendarEvent & {
  isOverlap?: boolean
  overlapIndex?: number
}

type Event = {
  dateString: string
  events: ListCalendarEvent[]
}

type EventGroup = {
  title: string
  data: Event[]
}

interface CalendarBodyForMonthViewProps {
  events: ListCalendarEvent[]
  ampm: boolean
  showTime: boolean
  style: ViewStyle
  eventCellStyle?: EventCellStyle
  onPressEvent?: (event: ICalendarEvent) => void
  renderEvent?: EventRenderer
  scrollToDate?: Date
  containerHeight: number
  onEndReached?: ((info: { distanceFromEnd: number }) => void) | null | undefined
  onEndReachedThreshold?: number | null | undefined
  listMonthSectionTextStyle?: TextStyle
  listGetCurrentSection?: (currentSection: string) => void
  listStickySectionHeadersEnabled?: boolean
}

function _CalendarBodyForListView({
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
}: CalendarBodyForMonthViewProps) {
  const theme = useTheme()

  const sectionListRef = React.useRef<SectionList<Event>>(null)

  let lastOverlapIndex = React.useRef(1)

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

          const groupEvent = element.data.find(
            (el) => el.dateString === eventDate.format('YYYY-MM-DD'),
          )

          if (!groupEvent) {
            const data: Event = { dateString: eventDate.format('YYYY-MM-DD'), events: [] }
            lastOverlapIndex.current = 1
            data.events.push(event)
            element.data.push(data)
          } else {
            if (
              groupEvent.events.some((ev) => dayjs(ev.start).isSame(dayjs(event.start), 'minute'))
            ) {
              event.isOverlap = true
              event.overlapIndex = lastOverlapIndex.current
              lastOverlapIndex.current++
            } else {
              event.isOverlap = false
              lastOverlapIndex.current = 1
            }
            groupEvent.events.push(event)
          }

          return elements
        }, [] as EventGroup[]),
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

  const renderSectionHeader = (info: { section: SectionListData<Event> }) => {
    return (
      <View style={{ width: '100%', backgroundColor: '#fff', paddingVertical: 8, paddingLeft: 16 }}>
        <Text style={[theme.typography.xl, { ...listMonthSectionTextStyle }]}>
          {dayjs(info.section.title).format('MMM, YYYY')}
        </Text>
      </View>
    )
  }

  const renderItem = React.useCallback(
    (result: { item: Event }) => {
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
            {result.item.events.map((event: ListCalendarEvent, index: number) => {
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

  const ItemSeparatorComponent = React.useCallback(() => <View />, [])

  const SectionSeparatorComponent = React.useCallback(() => <View />, [])

  return (
    <View style={Platform.OS === 'web' ? { height: containerHeight } : u['flex-1']}>
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
        ItemSeparatorComponent={ItemSeparatorComponent}
        SectionSeparatorComponent={SectionSeparatorComponent}
        onViewableItemsChanged={onCheckViewableItems}
        bounces={false}
        windowSize={5}
        initialNumToRender={5}
        maxToRenderPerBatch={20}
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

const areEqual = (prev: CalendarBodyForMonthViewProps, next: CalendarBodyForMonthViewProps) => {
  if (JSON.stringify(prev.events) !== JSON.stringify(next.events)) {
    return false
  }
  if (prev.containerHeight !== next.containerHeight) {
    return false
  }
  if (prev.listStickySectionHeadersEnabled !== next.listStickySectionHeadersEnabled) {
    return false
  }
  return true
}

export const CalendarBodyForListView = React.memo(_CalendarBodyForListView, areEqual)
