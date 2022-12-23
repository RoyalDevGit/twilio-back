import { Expert } from 'models/Expert'
import { SessionModel, SessionStatus } from 'models/Session'

export const getExpertActiveSessions = (expert: Expert) =>
  SessionModel.find({
    status: SessionStatus.Active,
    $or: [{ expert: expert.id }, { consumer: expert.user.id }],
  })
