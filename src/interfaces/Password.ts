export enum PasswordErrorType {
  LENGTH = 'validatePasswordLength',
  UPPERCASE = 'validatePasswordUppercase',
  LOWERCASE = 'validatePasswordLowercase',
  DIGIT = 'validatePasswordDigit',
  UNIQUE = 'validatePasswordUnique',
  NO_SPACES = 'validatePasswordNoSpaces',
  SPECIAL_CHARACTER = 'validatePasswordSpecialCharacter',
}
