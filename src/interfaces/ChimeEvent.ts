export interface ChimeEvent<T> {
  version: string
  id: string
  'detail-type': string
  source: string
  account: string
  time: Date
  region: string
  resources: unknown[]
  detail: T
}

export type ChimeEventType =
  | 'chime:MeetingStarted'
  | 'chime:MeetingEnded'
  | 'chime:AttendeeAdded'
  | 'chime:AttendeeDeleted'
  | 'chime:AttendeeDropped'
  | 'chime:AttendeeLeft'
  | 'chime:AttendeeJoined'
  | 'chime:AttendeeAuthorized'
  | 'chime:AttendeeVideoStarted'
  | 'chime:AttendeeVideoStopped'
  | 'chime:AttendeeContentJoined'
  | 'chime:AttendeeContentLeft'
  | 'chime:AttendeeContentJoined'
  | 'chime:AttendeeContentDropped'
  | 'chime:AttendeeContentVideoStarted'
  | 'chime:AttendeeContentVideoStopped'
  | 'chime:MediaPipelineInProgress'
  | 'chime:MediaPipelineDeleted'

export interface ChimeEventDetail {
  version: string
  eventType: ChimeEventType
  timestamp: number
  meetingId: string
  externalMeetingId: string
  mediaRegion: string
}

export type ChimeMeetingStarted = ChimeEventDetail

export type ChimeMeetingEnded = ChimeEventDetail

export interface ChimeMediaPipelineEventDetail extends ChimeEventDetail {
  mediaPipelineId: string
}

export type ChimeMediaPipelineInProgress = ChimeMediaPipelineEventDetail

export type ChimeMediaPipelineDeleted = ChimeMediaPipelineEventDetail

export interface ChimeAttendeeEventDetail extends ChimeEventDetail {
  attendeeId: string
  externalUserId: string
}

export interface ChimeAttendeeWithNetworkEventDetail
  extends ChimeAttendeeEventDetail {
  networkType: string
}

export type ChimeAttendeeAdded = ChimeAttendeeEventDetail
export type ChimeAttendeeJoined = ChimeAttendeeWithNetworkEventDetail
export type ChimeAttendeeAuthorized = ChimeAttendeeEventDetail
export type ChimeAttendeeLeft = ChimeAttendeeWithNetworkEventDetail
export type ChimeAttendeeDeleted = ChimeAttendeeEventDetail
export type ChimeAttendeeDropped = ChimeAttendeeWithNetworkEventDetail
export type ChimeAttendeeVideoStarted = ChimeAttendeeEventDetail
export type ChimeAttendeeVideoStopped = ChimeAttendeeEventDetail
export type ChimeAttendeeContentJoined = ChimeAttendeeWithNetworkEventDetail
export type ChimeAttendeeContentLeft = ChimeAttendeeWithNetworkEventDetail
export type ChimeAttendeeContentDropped = ChimeAttendeeWithNetworkEventDetail
export type ChimeAttendeeContentVideoStarted = ChimeAttendeeEventDetail
export type ChimeAttendeeContentVideoStopped = ChimeAttendeeEventDetail
