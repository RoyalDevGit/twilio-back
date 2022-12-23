import { Types, PipelineStage } from 'mongoose'

import { User } from 'models/User'
import { getExpertProfileByUser } from 'repositories/user/getExpertProfileByUser'
import { SessionModel, SessionStatus } from 'models/Session'

export type SessionByStatus = Record<SessionStatus, number>

export const getUserSessionsByStatus = async (user: User) => {
  const expert = await getExpertProfileByUser(user)
  const query = expert
    ? {
        $or: [
          { consumer: new Types.ObjectId(user.id) },
          { expert: new Types.ObjectId(user.id) },
        ],
      }
    : { consumer: new Types.ObjectId(user.id) }

  const pipeline: PipelineStage[] = [
    {
      $match: query,
    },
    {
      $group: {
        _id: '$status',
        count: {
          $sum: 1.0,
        },
      },
    },
  ]

  interface Result {
    _id: SessionStatus
    count: number
  }

  const pipelineResult = (await SessionModel.aggregate(
    pipeline
  ).exec()) as Result[]

  const result = {} as SessionByStatus

  pipelineResult.forEach((r) => {
    result[r._id] = r.count
  })

  return result
}
