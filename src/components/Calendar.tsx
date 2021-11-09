import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { merge } from 'merge-anything'
import React from 'react'

import { defaultTheme } from '../theme/defaultTheme'
import { ThemeContext } from '../theme/ThemeContext'
import { ThemeInterface } from '../theme/ThemeInterface'
import { DeepPartial } from '../utility-types'
import { typedMemo } from '../utils'
import { CalendarContainer, CalendarContainerProps } from './CalendarContainer'

// Make sure to only include the library in development
// if (process.env.NODE_ENV === 'development') {
//   const whyDidYouRender = require('@welldone-software/why-did-you-render');
//   whyDidYouRender(React, {
//     trackAllPureComponents: true,
//   });
// }

export interface CalendarProps extends CalendarContainerProps {
  theme?: DeepPartial<ThemeInterface>
  isRTL?: boolean
}

dayjs.extend(isBetween)

function _Calendar({ theme = defaultTheme, isRTL, ...props }: CalendarProps) {
  const _theme = merge(defaultTheme, theme, { isRTL }) as ThemeInterface
  return (
    <ThemeContext.Provider value={_theme}>
      <CalendarContainer {...props} />
    </ThemeContext.Provider>
  )
}

export const Calendar = typedMemo(_Calendar)
