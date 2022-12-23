import { ActionTokenType } from 'enums/ActionTokenType'

export interface ActionTokenData<T> {
  type: ActionTokenType
  data: T
}
