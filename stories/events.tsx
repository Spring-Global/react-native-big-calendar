import dayjs from 'dayjs'
import React from 'react'
import { RecursiveArray, Text, TouchableOpacity, View, ViewStyle } from 'react-native'

import { EventRenderer, ICalendarEvent } from '../src/interfaces'
import { formatStartEnd } from '../src/utils'

const eventNotes = (
  <View style={{ marginTop: 3 }}>
    <Text style={{ fontSize: 10, color: 'white' }}> Phone number: 555-123-4567 </Text>
    <Text style={{ fontSize: 10, color: 'white' }}> Arrive 15 minutes early </Text>
  </View>
)

export let events: ICalendarEvent<{ color?: string }>[] = [
  {
    title: 'Watch Boxing',
    start: dayjs().set('hour', 0).set('minute', 0).set('second', 0).toDate(),
    end: dayjs().set('hour', 1).set('minute', 30).toDate(),
  },
  {
    title: 'Meeting',
    start: dayjs().set('hour', 10).set('minute', 0).toDate(),
    end: dayjs().set('hour', 10).set('minute', 30).toDate(),
  },
  {
    title: 'Coffee break',
    start: dayjs().set('hour', 14).set('minute', 30).toDate(),
    end: dayjs().set('hour', 15).set('minute', 30).toDate(),
  },
  {
    title: 'with color prop',
    start: dayjs().set('hour', 16).set('minute', 0).toDate(),
    end: dayjs().set('hour', 18).set('minute', 30).toDate(),
    color: 'purple',
  },
  {
    title: 'Repair my car',
    start: dayjs().add(1, 'day').set('hour', 7).set('minute', 45).toDate(),
    end: dayjs().add(1, 'day').set('hour', 13).set('minute', 30).toDate(),
  },
  {
    title: 'Meet Realtor',
    start: dayjs().add(1, 'day').set('hour', 8).set('minute', 25).toDate(),
    end: dayjs().add(1, 'day').set('hour', 9).set('minute', 55).toDate(),
  },
  {
    title: 'Laundry',
    start: dayjs().add(1, 'day').set('hour', 8).set('minute', 25).toDate(),
    end: dayjs().add(1, 'day').set('hour', 11).set('minute', 0).toDate(),
  },
  {
    title: "Doctor's appointment",
    start: dayjs().set('hour', 13).set('minute', 0).toDate(),
    end: dayjs().set('hour', 14).set('minute', 15).toDate(),
    children: eventNotes,
  },
]
//events.push(...events);

let day = 1
function incrementDayFromInterval(min: number, max: number) {
  // min and max included
  //return Math.floor(Math.random() * (max - min + 1) + min);
  day++
  if (day > max) {
    day = min
  }
  //console.log("day", day);
  return day
}

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

console.time('start creating')
for (let i = 0; i < 50000; i++) {
  const day = incrementDayFromInterval(1, 30)
  const hour = randomIntFromInterval(1, 23)
  const startDate = dayjs()
    .set('day', day)
    .set('month', 0)
    .set('hour', hour)
    .set('minute', 0)
    .toDate()
  events.push({
    title: startDate.toString(),
    start: startDate,
    end: dayjs()
      .set('day', day)
      .set('month', 0)
      .set('hour', hour + 1)
      .set('minute', 30)
      .toDate(),
  })
}
for (let i = 0; i < 50000; i++) {
  const day = incrementDayFromInterval(1, 30)
  const hour = randomIntFromInterval(1, 23)
  const startDate = dayjs()
    .set('day', day)
    .set('month', 1)
    .set('hour', hour)
    .set('minute', 0)
    .toDate()
  events.push({
    title: startDate.toString(),
    start: startDate,
    end: dayjs()
      .set('day', day)
      .set('month', 1)
      .set('hour', hour + 1)
      .set('minute', 30)
      .toDate(),
  })
}
console.timeEnd('start creating')
//console.log("events", events.length);
// console.log("events", events);
/*events = events.map(evt => {
  const day = randomIntFromInterval(1, 10);
  evt.start.setDate(day)
  evt.end.setDate(day);
  evt.title = evt.start.toString() + evt.title;
  console.log("evt", evt);  
  return evt;
});*/

export const spanningEvents: ICalendarEvent<{ color?: string }>[] = [
  {
    title: 'Watch Boxing',
    start: dayjs().subtract(1, 'week').set('hour', 14).set('minute', 30).toDate(),
    end: dayjs().subtract(1, 'week').set('hour', 15).set('minute', 30).toDate(),
  },
  {
    title: 'Laundry',
    start: dayjs().subtract(1, 'week').set('hour', 1).set('minute', 30).toDate(),
    end: dayjs().subtract(1, 'week').set('hour', 2).set('minute', 30).toDate(),
  },
  {
    title: 'Meeting',
    start: dayjs().subtract(1, 'week').set('hour', 10).set('minute', 0).toDate(),
    end: dayjs().add(1, 'week').set('hour', 10).set('minute', 30).toDate(),
  },
  {
    title: 'Coffee break',
    start: dayjs().set('hour', 14).set('minute', 30).toDate(),
    end: dayjs().add(1, 'week').set('hour', 15).set('minute', 30).toDate(),
  },
  {
    title: 'Repair my car',
    start: dayjs().add(1, 'day').set('hour', 7).set('minute', 45).toDate(),
    end: dayjs().add(4, 'day').set('hour', 13).set('minute', 30).toDate(),
  },
]

export interface MyCustomEventType {
  color?: string
}

export const customEventRenderer: EventRenderer<MyCustomEventType> = (
  event,
  touchableOpacityProps,
) => {
  return (
    <TouchableOpacity
      {...touchableOpacityProps}
      style={[
        ...(touchableOpacityProps.style as RecursiveArray<ViewStyle>),
        {
          backgroundColor: 'white',
          borderWidth: 1,
          borderColor: 'lightgrey',
          borderLeftColor: event.color ? event.color : 'green',
          borderLeftWidth: 10,
          borderStyle: 'solid',
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      {dayjs(event.end).diff(event.start, 'minute') < 32 ? (
        <Text style={[{ color: 'black' }]}>
          {event.title},
          <Text style={[{ color: 'black' }]}>{dayjs(event.start).format('HH:mm')}</Text>
        </Text>
      ) : (
        <>
          <Text style={[{ color: 'black' }]}>{event.title}</Text>
          <Text style={[{ color: 'black' }]}>
            {formatStartEnd(event.start, event.end, 'HH:mm')}
          </Text>
          {event.children && event.children}
        </>
      )}
    </TouchableOpacity>
  )
}
