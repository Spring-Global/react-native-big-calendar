import dayjs from 'dayjs'
import * as React from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'

import { u } from '../commonStyles'
import { useTheme } from '../theme/ThemeContext'

interface HourGuideCellProps {
  cellHeight: number
  onPress: (d: dayjs.Dayjs) => void
  date: dayjs.Dayjs
  hour: number
}

const _HourGuideCell = ({ cellHeight, onPress, date, hour }: HourGuideCellProps) => {
  const theme = useTheme()

  return (
    <TouchableWithoutFeedback onPress={() => onPress(date.hour(hour).minute(0))}>
      <View
        style={[
          u['border-l'],
          u['border-b'],
          { borderColor: theme.palette.gray['200'] },
          { height: cellHeight },
        ]}
      />
    </TouchableWithoutFeedback>
  )
}

const areEqual = (prev: HourGuideCellProps, next: HourGuideCellProps) => {
  if (prev.cellHeight !== next.cellHeight) {
    return false
  }
  if (!prev.date.isSame(next.date)) {
    return false
  }
  if (prev.hour !== next.hour) {
    return false
  }
  return true
}

export const HourGuideCell = React.memo(_HourGuideCell, areEqual)
