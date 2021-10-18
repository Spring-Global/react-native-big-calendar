import React from 'react'
import { Text, TouchableOpacity } from 'react-native'

import { u } from '../commonStyles'
import { useCalendarTouchableOpacityProps } from '../hooks/useCalendarTouchableOpacityProps'
import { EventCellStyle, EventRenderer } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { formatStartEnd, typedMemo } from '../utils'
import { ListCalendarEvent } from './CalendarBodyForListView'

interface CalendarEventProps<T> {
  event: ListCalendarEvent<T>
  onPressEvent?: (event: ListCalendarEvent<T>) => void
  eventCellStyle?: EventCellStyle<T>
  renderEvent?: EventRenderer<T>
  isRTL: boolean
  ampm: boolean
}

const OVERLAP_OFFSET = 20

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
      {
        backgroundColor: theme.palette.primary.main,
        marginLeft: event.isOverlap ? OVERLAP_OFFSET * (event.overlapIndex ?? 0) : 0,
      },
      isRTL ? { right: 0 } : { left: 0 },
      event.isOverlap && event.overlapIndex !== 0 ? { marginTop: -6 } : u['mt-6'],
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
