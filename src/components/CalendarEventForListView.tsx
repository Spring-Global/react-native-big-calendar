import React from 'react'
import { Text, TouchableOpacity } from 'react-native'

import { u } from '../commonStyles'
import { useCalendarTouchableOpacityProps } from '../hooks/useCalendarTouchableOpacityProps'
import { EventCellStyle, EventRenderer, ICalendarEvent } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { formatStartEnd, typedMemo } from '../utils'

interface CalendarEventProps<T> {
  event: ICalendarEvent<T>
  onPressEvent?: (event: ICalendarEvent<T>) => void
  eventCellStyle?: EventCellStyle<T>
  renderEvent?: EventRenderer<T>
  isRTL: boolean
  ampm: boolean
}

function _CalendarEventForListView<T>({
  event,
  eventCellStyle,
  onPressEvent,
  renderEvent,
  isRTL,
  ampm,
}: CalendarEventProps<T>) {
  const theme = useTheme()

  const touchableOpacityProps = useCalendarTouchableOpacityProps({
    event,
    eventCellStyle,
    onPressEvent,
    injectedStyles: [
      { backgroundColor: theme.palette.primary.main },
      isRTL ? { right: 0 } : { left: 0 },
      u['mt-2'],
    ],
  })

  if (renderEvent) {
    return renderEvent(event, touchableOpacityProps)
  }

  return (
    <TouchableOpacity {...touchableOpacityProps}>
      <Text style={{ color: theme.palette.primary.contrastText }}>{event.title}</Text>
      <Text style={{ color: theme.palette.primary.contrastText }}>
        {formatStartEnd(event.start, event.end, ampm ? 'h:mm a' : 'HH:mm')}
      </Text>
    </TouchableOpacity>
  )
}

export const CalendarEventForListView = typedMemo(_CalendarEventForListView)
