import { Env } from 'utils/env'
import { invokeLambda } from 'apis/AwsLambda'

const AWS_PROCESS_CHIME_RECORDING_LAMBDA_ARN = Env.getString(
  'AWS_PROCESS_CHIME_RECORDING_LAMBDA_ARN'
)

export interface ProcessChimeRecordingParams {
  sourceBucket: string
  meetingId: string
  recordingIndex: number
  targetBucket: string
}
interface ProcessChimeRecordingResponse {
  fileKey: string
}

export const processChimeRecording = (req: ProcessChimeRecordingParams) =>
  invokeLambda<ProcessChimeRecordingResponse>({
    FunctionName: AWS_PROCESS_CHIME_RECORDING_LAMBDA_ARN,
    Payload: JSON.stringify(req),
  })
