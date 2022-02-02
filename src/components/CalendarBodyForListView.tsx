import dayjs from 'dayjs'
import * as React from 'react'
import {
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

type ListItemProps = {
  isToday: boolean
  dateHeaderTodayDayText?: TextStyle
  dateHeaderDayText?: TextStyle
  date: dayjs.Dayjs
  dateHeaderTodayContainer?: ViewStyle
  dateHeaderTodayText?: TextStyle
  dateHeaderText?: TextStyle
  ampm: boolean
  isRTL: boolean
  renderEvent?: EventRenderer<any>
  onPressEvent?: (event: any) => void
  eventCellStyle?: EventCellStyle<any>
  events: ListCalendarEvent<any>[]
  selectedItem: any
}

const ListItem = ({
  isToday,
  ampm,
  date,
  events,
  isRTL,
  dateHeaderDayText,
  dateHeaderTodayContainer,
  dateHeaderTodayDayText,
  eventCellStyle,
  onPressEvent,
  renderEvent,
  dateHeaderTodayText,
  dateHeaderText,
  selectedItem,
}: ListItemProps) => {
  return (
    <View style={[u['flex-row'], { marginVertical: ITEM_SPACING }]}>
      <View style={{ width: 60 }}>
        <Text
          style={[
            u['text-center'],
            {
              ...(isToday ? dateHeaderTodayDayText ?? {} : dateHeaderDayText ?? {}),
            },
          ]}
        >
          {date.format('ddd')}
        </Text>
        <View
          style={
            isToday
              ? [
                  u['h-36'],
                  u['w-36'],
                  u['pb-6'],
                  u['rounded-full'],
                  u['items-center'],
                  u['justify-center'],
                  u['self-center'],
                  u['z-20'],
                  dateHeaderTodayContainer ?? {},
                ]
              : [u['mb-6']]
          }
        >
          <Text
            style={[
              u['text-center'],
              Platform.OS === 'web' && isToday && u['mt-6'],
              {
                ...(isToday ? dateHeaderTodayText ?? {} : dateHeaderText ?? {}),
              },
            ]}
          >
            {date.format('D')}
          </Text>
        </View>
      </View>

      <View style={u['flex-1']}>
        {events.map((event: ListCalendarEvent<any>, index: number) => {
          const _selected = selectedItem === event.idVisitInstance
          return (
            <CalendarEventForListView
              key={index}
              ampm={ampm}
              isRTL={isRTL}
              event={event}
              eventCellStyle={eventCellStyle}
              onPressEvent={onPressEvent}
              renderEvent={renderEvent}
              selected={_selected}
            />
          )
        })}
      </View>
    </View>
  )
}

const areEqual2 = (prev: ListItemProps, next: ListItemProps) => {
  if (!prev.date.isSame(next.date)) {
    return false
  }
  if (JSON.stringify(prev.events) !== JSON.stringify(next.events)) {
    return false
  }
  if (prev.isToday !== next.isToday) {
    return false
  }
  if (prev.selectedItem !== next.selectedItem) {
    return false
  }
  return true
}

const MemoizedListItem = React.memo(ListItem, areEqual2)

export type ListCalendarEvent<T> = ICalendarEvent<T> & {
  isOverlap?: boolean
  overlapIndex?: number
}

type Event<T> = {
  dateString: string
  events: ListCalendarEvent<T>[]
}

type EventGroup<T> = {
  title: string
  data: Event<T>[]
}

interface CalendarBodyForListViewProps<T> {
  events: ListCalendarEvent<T>[]
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
  selectedItem?: any
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
  selectedItem,
}: CalendarBodyForListViewProps<T>) {
  const theme = useTheme()

  const sectionListRef = React.useRef<SectionList<Event<T>>>(null)

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
            const data: Event<T> = { dateString: eventDate.format('YYYY-MM-DD'), events: [] }
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

  const renderSectionHeader = (info: { section: SectionListData<Event<T>> }) => {
    return (
      <View style={{ width: '100%', backgroundColor: '#fff', paddingVertical: 8, paddingLeft: 16 }}>
        <Text style={[theme.typography.xl, { ...listMonthSectionTextStyle }]}>
          {dayjs(info.section.title).format('MMM, YYYY')}
        </Text>
      </View>
    )
  }

  const renderSeparator = React.useCallback(() => {
    return <View style={{ width: '100%', height: 1, backgroundColor: 'lightgrey' }} />
  }, [])

  const renderSectionSeparatorComponent = React.useCallback(() => {
    return <View />
  }, [])

  const renderItem = (result: { item: Event<T> }) => {
    const dateString = result.item.dateString
    const date = dayjs(dateString)
    const _isToday = isToday(date)

    return (
      <MemoizedListItem
        ampm={ampm}
        date={date}
        events={result.item.events}
        isRTL={theme.isRTL}
        isToday={_isToday}
        dateHeaderDayText={theme.customStyles?.dateHeaderDayText}
        dateHeaderText={theme.customStyles?.dateHeaderText}
        dateHeaderTodayContainer={theme.customStyles?.dateHeaderTodayContainer}
        dateHeaderTodayDayText={theme.customStyles?.dateHeaderTodayDayText}
        dateHeaderTodayText={theme.customStyles?.dateHeaderTodayText}
        eventCellStyle={eventCellStyle}
        onPressEvent={onPressEvent}
        renderEvent={renderEvent}
        selectedItem={selectedItem}
      />
    )
  }

  return (
    <View style={Platform.OS === 'web' ? { height: containerHeight } : u['flex-1']}>
      <SectionList
        ref={sectionListRef}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        showsVerticalScrollIndicator={false}
        sections={eventsGroupedByDay}
        stickySectionHeadersEnabled={listStickySectionHeadersEnabled}
        renderSectionHeader={renderSectionHeader}
        ItemSeparatorComponent={renderSeparator}
        SectionSeparatorComponent={renderSectionSeparatorComponent}
        onViewableItemsChanged={onCheckViewableItems}
        bounces={false}
        extraData={selectedItem}
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

function areEqual<T>(prev: CalendarBodyForListViewProps<T>, next: CalendarBodyForListViewProps<T>) {
  if (prev.selectedItem !== next.selectedItem) {
    return false
  }
  if (JSON.stringify(prev.events) !== JSON.stringify(next.events)) {
    return false
  }
  if (prev.scrollToDate !== next.scrollToDate) {
    return false
  }
  if (prev.listStickySectionHeadersEnabled !== next.listStickySectionHeadersEnabled) {
    return false
  }
  return true
}

export const CalendarBodyForListView = typedMemo(_CalendarBodyForListView, areEqual as any)
