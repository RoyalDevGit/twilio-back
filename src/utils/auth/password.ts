import bcrypt from 'bcryptjs'

import { PasswordErrorType } from 'interfaces/Password'
import { ValidationError } from 'utils/error/ApiError'

export const hashPassword = (password: string): string =>
  bcrypt.hashSync(password)

export const verifyPassword = (hash: string, password: string): boolean =>
  bcrypt.compareSync(password, hash)

const enforceUnique = (password: string, min: number): boolean => {
  const unique: string[] = []
  for (let i = 0; i < password.length; i++) {
    const char: string = password.charAt(i)
    if (unique.indexOf(char) === -1) unique.push(char)
    if (unique.length === min) return true
  }
  return false
}

const generatePasswordValidationError = (type: PasswordErrorType) =>
  new ValidationError(type, {
    path: 'password',
    type: 'pattern',
    value: type,
  })

export interface IValidatePasswordResults {
  valid: boolean
  results: ValidationError[]
}

/**
 * Simple method to help enforce a standard password policy
 * It is both easier to maintain and read when the rules are broken apart vs having one big regex
 * @param password
 * @returns
 */
export const validatePassword = (
  password: string
): IValidatePasswordResults => {
  const errors: ValidationError[] = []

  // Checks to make sure there is at least one lowercase letter
  if (!password.match(/^(?=.*?[a-z])/)) {
    errors.push(generatePasswordValidationError(PasswordErrorType.LOWERCASE))
  }

  // Checks to make sure there is at least one uppercase letter
  if (!password.match(/^(?=.*?[A-Z])/)) {
    errors.push(generatePasswordValidationError(PasswordErrorType.UPPERCASE))
  }

  // Checks to make sure there is at least one digit
  if (!password.match(/(?=.*?[0-9])/)) {
    errors.push(generatePasswordValidationError(PasswordErrorType.DIGIT))
  }

  // Checks to make sure there is at least one special character
  if (
    !password.match(
      '([`~\\!@#\\$%\\^\\&\\*\\(\\)\\-_\\=\\+\\[\\{\\}\\]\\\\|;:\\\'",<.>\\/\\?€£¥₹§±].*)'
    )
  ) {
    errors.push(
      generatePasswordValidationError(PasswordErrorType.SPECIAL_CHARACTER)
    )
  }
  // Checks to make sure there are no spaces
  if (password.match('([\\s].*)')) {
    errors.push(generatePasswordValidationError(PasswordErrorType.NO_SPACES))
  }

  // Ensures the password is between 10-100 characters long
  if (!password.match(/^.{10,100}$/)) {
    errors.push(generatePasswordValidationError(PasswordErrorType.LENGTH))
  }

  // Ensures that there are 5 or more unique characters
  if (!enforceUnique(password, 5)) {
    errors.push(generatePasswordValidationError(PasswordErrorType.UNIQUE))
  }
  return {
    valid: errors.length === 0,
    results: errors,
  }
}
