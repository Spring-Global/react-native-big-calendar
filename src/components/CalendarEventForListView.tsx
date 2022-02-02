import dayjs from 'dayjs'
import React from 'react'
import { GestureResponderEvent, Text, TouchableOpacity } from 'react-native'

import { CalendarTouchableOpacityProps, EventCellStyle, EventRenderer } from '../interfaces'
import { formatStartEnd } from '../utils'
import { ListCalendarEvent } from './CalendarBodyForListView'

interface CalendarEventProps<T> {
  event: ListCalendarEvent<T>
  onPressEvent?: (event: ListCalendarEvent<T>) => void
  eventCellStyle?: EventCellStyle<T>
  renderEvent?: EventRenderer<T>
  isRTL: boolean
  ampm: boolean
  selected: boolean
}

function _CalendarEventForListView<T>({
  event,
  onPressEvent,
  renderEvent,
  ampm,
}: CalendarEventProps<T>) {
  const plainJsEvent = React.useMemo(
    () => ({
      ...event,
      start: dayjs(event.start).toDate(),
      end: dayjs(event.end).toDate(),
    }),
    [event],
  )

  const _onPress = React.useCallback(
    (evt: GestureResponderEvent) => {
      onPressEvent && onPressEvent({ ...evt, ...plainJsEvent })
    },
    [onPressEvent, plainJsEvent],
  )

  const touchableOpacityProps: CalendarTouchableOpacityProps = {
    delayPressIn: 20,
    key: `${event.start}_${event.title}`,
    onPress: _onPress,
    style: undefined,
    disabled: !onPressEvent,
  }

  if (renderEvent) {
    return renderEvent(event, touchableOpacityProps)
  }

  return (
    <TouchableOpacity {...touchableOpacityProps}>
      <Text>{event.title}</Text>
      <Text>{formatStartEnd(event.start, event.end, ampm ? 'h:mm a' : 'HH:mm')}</Text>
    </TouchableOpacity>
  )
}

const areEqual = (prev: CalendarEventProps<any>, next: CalendarEventProps<any>) => {
  if (JSON.stringify(prev.event) !== JSON.stringify(next.event)) {
    return false
  }
  if (prev.selected !== next.selected) {
    return false
  }
  return true
}

export const CalendarEventForListView = React.memo(_CalendarEventForListView, areEqual)
