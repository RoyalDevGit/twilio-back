import { SequenceLedgerKey, SequenceLedgerModel } from 'models/SequenceLedger'

export const getNextInSequence = async (key: SequenceLedgerKey) => {
  const sequence = await SequenceLedgerModel.findOneAndUpdate(
    { key },
    { $inc: { current: 1 } },
    {
      upsert: true,
      new: true,
    }
  )
  return sequence.current
}
