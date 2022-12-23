import sgMail, { MailDataRequired } from '@sendgrid/mail'

import { Env } from 'utils/env'
import { User } from 'models/User'

const SENDGRID_API_KEY = Env.getString('SENDGRID_API_KEY')

sgMail.setApiKey(SENDGRID_API_KEY)

const EMAIL_FROM = Env.getString('EMAIL_FROM')
const EMAIL_FROM_NAME = Env.getString('EMAIL_FROM_NAME')

interface SendGridEmailOptions {
  targetUser: User
  subject: string
  templateId: string
  dynamicTemplateData: object
}

export const sendSgEmail = async ({
  targetUser,
  subject,
  templateId,
  dynamicTemplateData,
}: SendGridEmailOptions) => {
  if (!targetUser.emailAddress || !subject || !templateId) {
    throw new Error('Invalid arguments to send email')
  }

  const message: MailDataRequired = {
    templateId: templateId.trim(),
    dynamicTemplateData: {
      ...dynamicTemplateData,
      subject,
    },
    from: {
      name: EMAIL_FROM_NAME,
      email: EMAIL_FROM,
    },
    to: {
      name: `${targetUser.firstName} ${targetUser.lastName}`,
      email: targetUser.emailAddress,
    },
  }
  const result = await sgMail.send(message)
  return result
}
