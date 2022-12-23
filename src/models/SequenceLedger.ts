import mongoose, { Schema, Document } from 'mongoose'

import { getEnumValues } from 'utils/enum/enumUtils'

export enum SequenceLedgerKey {
  Order = 'order',
}

export interface SequenceLedger extends Document {
  key: SequenceLedgerKey
  current: number
}

const SequenceLedgerSchema = new Schema<SequenceLedger>(
  {
    key: {
      type: String,
      enum: getEnumValues(SequenceLedgerKey),
      required: true,
      unique: true,
      immutable: true,
    },
    current: {
      type: Number,
      required: true,
      default: 0,
      min: 1,
    },
  },
  { collection: 'sequenceledger', timestamps: true }
)

export const SequenceLedgerModel = mongoose.model<SequenceLedger>(
  'SequenceLedger',
  SequenceLedgerSchema
)
