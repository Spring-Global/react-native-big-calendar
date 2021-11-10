import React from 'react'
import { Text, TouchableOpacity } from 'react-native'

import { u } from '../commonStyles'
import { useCalendarTouchableOpacityProps } from '../hooks/useCalendarTouchableOpacityProps'
import { EventCellStyle, EventRenderer } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { formatStartEnd, typedMemo } from '../utils'
import { ListCalendarEvent } from './CalendarBodyForListView'

interface CalendarEventProps {
  event: ListCalendarEvent
  onPressEvent?: (event: ListCalendarEvent) => void
  eventCellStyle?: EventCellStyle
  renderEvent?: EventRenderer
  isRTL: boolean
  ampm: boolean
}

const OVERLAP_OFFSET = 20

function _CalendarEventForListView({
  event,
  eventCellStyle,
  onPressEvent,
  renderEvent,
  isRTL,
  ampm,
}: CalendarEventProps) {
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

const areEqual = (prev: CalendarEventProps, next: CalendarEventProps) => {
  if (JSON.stringify(prev.event) !== JSON.stringify(next.event)) {
    return false
  }
  return true
}

export const CalendarEventForListView = React.memo(_CalendarEventForListView, areEqual)
