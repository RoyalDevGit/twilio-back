import { ObjectIdLike } from 'interfaces/ModelRef'
import {
  SessionExtensionRequestModel,
  SessionExtensionRequestStatus,
} from 'models/SessionExtensionRequest'
import { sessionExtensionRequestPopulationPaths } from 'repositories/session/populateSessionExtensionRequest'

export const getCurrentSessionExtension = async (sessionId: ObjectIdLike) => {
  const extRequest = await SessionExtensionRequestModel.findOne({
    session: sessionId,
    status: {
      $in: [
        SessionExtensionRequestStatus.Requested,
        SessionExtensionRequestStatus.Accepted,
      ],
    },
  }).populate(sessionExtensionRequestPopulationPaths)
  return extRequest
}
