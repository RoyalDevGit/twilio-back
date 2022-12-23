import { Session } from 'models/Session'
import { convertEventDateToDateTime } from 'utils/date/convertEventDateToDateTime'

export const isPastSession = (session: Session): boolean => {
  const endDate = convertEventDateToDateTime(session.endDate)
  return endDate.diffNow().milliseconds < 0
}
