export interface ChannelMessageSenderInfo {
  id: string
  firstName: string
  lastName: string
  profilePictureKey?: string
}

export interface ChannelMessageEmbeddedMetadata {
  id: string
  sender: ChannelMessageSenderInfo
  attachmentCount: number
  attachmentsOnly: boolean
}

export interface ChannelMessage {
  id: string
  metadataId?: string
  content: string
  sender: ChannelMessageSenderInfo
  attachmentCount: number
  attachmentsOnly: boolean
  createdAt: string
  updatedAt: string
}
