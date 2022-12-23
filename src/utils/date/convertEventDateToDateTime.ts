import { DateTime } from 'luxon'

import { EventDate } from 'models/Event'

export const convertEventDateToDateTime = ({ date, timeZone }: EventDate) =>
  DateTime.fromJSDate(date, { zone: timeZone })
