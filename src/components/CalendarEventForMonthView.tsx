import dayjs from 'dayjs'
import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import { u } from '../commonStyles'
import { useCalendarTouchableOpacityProps } from '../hooks/useCalendarTouchableOpacityProps'
import { EventCellStyle, EventRenderer, ICalendarEvent } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { getEventSpanningInfo, typedMemo } from '../utils'

interface CalendarEventProps {
  event: ICalendarEvent
  onPressEvent?: (event: ICalendarEvent) => void
  eventCellStyle?: EventCellStyle
  renderEvent?: EventRenderer
  date: dayjs.Dayjs
  dayOfTheWeek: number
  calendarWidth: number
  isRTL: boolean
}

function _CalendarEventForMonthView({
  event,
  onPressEvent,
  eventCellStyle,
  renderEvent,
  date,
  dayOfTheWeek,
  calendarWidth,
  isRTL,
}: CalendarEventProps) {
  const theme = useTheme()

  const { eventWidth, isMultipleDays, isMultipleDaysStart, eventWeekDuration } = React.useMemo(
    () => getEventSpanningInfo(event, date, dayOfTheWeek, calendarWidth),
    [date, dayOfTheWeek, event, calendarWidth],
  )

  const touchableOpacityProps = useCalendarTouchableOpacityProps({
    event,
    eventCellStyle,
    onPressEvent,
    injectedStyles: [
      { backgroundColor: theme.palette.primary.main },
      isMultipleDaysStart && eventWeekDuration > 1
        ? {
            position: 'absolute',
            width: eventWidth,
            zIndex: 10000,
          }
        : {},
      isRTL ? { right: 0 } : { left: 0 },
      u['mt-2'],
    ],
  })

  if (renderEvent) {
    return renderEvent(event, touchableOpacityProps)
  }

  return (
    <View style={{ minHeight: 22 }}>
      {((!isMultipleDays && date.isSame(event.start, 'day')) ||
        (isMultipleDays && isMultipleDaysStart)) && (
        <TouchableOpacity {...touchableOpacityProps}>
          <Text
            style={[
              { color: theme.palette.primary.contrastText },
              theme.typography.xs,
              u['truncate'],
              isRTL && { textAlign: 'right' },
            ]}
            numberOfLines={1}
          >
            {event.title}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const areEqual = (prev: CalendarEventProps, next: CalendarEventProps) => {
  if (!prev.date.isSame(next.date)) {
    return false
  }
  if (JSON.stringify(prev.event) !== JSON.stringify(next.event)) {
    return false
  }
  if (prev.dayOfTheWeek !== next.dayOfTheWeek) {
    return false
  }
  if (prev.onPressEvent !== next.onPressEvent) {
    return false
  }
  if (prev.renderEvent !== next.renderEvent) {
    return false
  }
  return true
}

export const CalendarEventForMonthView = React.memo(_CalendarEventForMonthView, areEqual)
