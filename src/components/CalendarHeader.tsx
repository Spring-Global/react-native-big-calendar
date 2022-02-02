import dayjs from 'dayjs'
import * as React from 'react'
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native'

import { eventCellCss, u } from '../commonStyles'
import { ICalendarEvent } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { isToday, typedMemo } from '../utils'

export interface CalendarHeaderProps<T> {
  dateRange: dayjs.Dayjs[]
  cellHeight: number
  headerCellHeight?: number
  style: ViewStyle
  allDayEvents: ICalendarEvent<T>[]
  showMonthOnHeader?: boolean
  onPressDateHeader?: (date: Date) => void
}

function _CalendarHeader<T>({
  dateRange,
  cellHeight,
  style,
  allDayEvents,
  onPressDateHeader,
  headerCellHeight,
  showMonthOnHeader,
}: CalendarHeaderProps<T>) {
  const _onPress = React.useCallback(
    (date: Date) => {
      onPressDateHeader && onPressDateHeader(date)
    },
    [onPressDateHeader],
  )

  const theme = useTheme()

  const borderColor = { borderColor: theme.palette.gray['200'] }
  const primaryBg = { backgroundColor: theme.palette.primary.main }

  const hasAllDayEventOnDateRange = React.useMemo(
    () =>
      allDayEvents.some((event) =>
        dayjs(event.start).isBetween(dateRange[0], dateRange[dateRange.length - 1]),
      ),
    [allDayEvents, dateRange],
  )

  const currentMonth = dayjs(dateRange[0]).format('MMM')

  return (
    <View
      style={[
        u['border-b-2'],
        borderColor,
        theme.isRTL ? u['flex-row-reverse'] : u['flex-row'],
        style,
      ]}
    >
      <View style={[u['z-10'], u['w-50'], borderColor, u['items-center'], u['justify-center']]}>
        {showMonthOnHeader && (
          <Text
            style={[
              theme.typography.xl,
              { fontWeight: '600' },
              theme.customStyles?.monthHeaderLandscapeText,
            ]}
          >
            {currentMonth}
          </Text>
        )}
      </View>
      {dateRange.map((date, index) => {
        const _isToday = isToday(date)
        return (
          <TouchableOpacity
            style={[u['flex-1'], u['pt-2']]}
            onPress={() => _onPress(date.toDate())}
            disabled={onPressDateHeader === undefined}
            key={date.toString()}
          >
            <View style={{ alignItems: 'stretch' }}>
              <View
                style={[
                  u['border-t'],
                  theme.isRTL && index > 0 ? u['border-l'] : u['border-r'],
                  !theme.isRTL && index > 0 ? u['border-r'] : u['border-l'],
                  borderColor,
                  { paddingVertical: 8 },
                ]}
              >
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
              </View>
              <View
                style={[
                  u['border-t'],
                  theme.isRTL && index > 0 ? u['border-l'] : u['border-r'],
                  !theme.isRTL && index > 0 ? u['border-r'] : u['border-l'],
                  borderColor,
                  { paddingVertical: 8 },
                ]}
              >
                <View
                  style={
                    _isToday
                      ? [
                          primaryBg,
                          u['rounded-full'],
                          u['items-center'],
                          u['justify-center'],
                          u['self-center'],
                          u['z-20'],
                          { width: 30, height: 30, borderRadius: 15 },
                          borderColor,
                          theme.customStyles?.dateHeaderTodayContainer,
                        ]
                      : {}
                  }
                >
                  <Text
                    style={[
                      {
                        color: _isToday
                          ? theme.palette.primary.contrastText
                          : theme.palette.gray['800'],
                      },
                      _isToday ? { fontSize: 16 } : theme.typography.xl,
                      u['text-center'],
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
            </View>
            {hasAllDayEventOnDateRange && (
              <View
                style={[
                  u['border-l'],
                  { borderColor: theme.palette.gray['200'] },
                  { height: headerCellHeight ?? cellHeight },
                ]}
              >
                {allDayEvents.map((event) => {
                  if (!dayjs(event.start).isSame(date, 'day')) {
                    return null
                  }
                  return (
                    <View
                      style={[eventCellCss.style, primaryBg]}
                      key={`${event.start}${event.title}`}
                    >
                      <Text
                        style={{
                          fontSize: theme.typography.sm.fontSize,
                          color: theme.palette.primary.contrastText,
                        }}
                      >
                        {event.title}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export const CalendarHeader = typedMemo(_CalendarHeader)
