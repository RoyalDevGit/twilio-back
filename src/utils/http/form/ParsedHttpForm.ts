import path from 'path'
import { PassThrough } from 'stream'

import { Request } from 'express'
import formidable from 'formidable'
import wildcardMatch from 'wildcard-match'

import { ValidationError } from 'utils/error/ApiError'
import { writableNoopStream } from 'utils/streams/noopStreams'

export interface FileInfo {
  fileName: string | null
  extension?: string
  mimeType?: string
  isImage: () => boolean
  isVideo: () => boolean
}

export interface ParseRequestFormOptions {
  onUpload?: (
    stream: PassThrough,
    formFile: ExpectedFormFile<unknown>
  ) => Promise<unknown> | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expectedFiles?: ExpectedFormFile<any>[]
  expectedFields?: ExpectedFormField[]
}

export class ExpectedFormFile<T> {
  formName: string
  required?: boolean
  expectedMimeType?: RegExp | string
  validate?: (formFile: ExpectedFormFile<T>) => void
  onUpload?: (stream: PassThrough, formFile: ExpectedFormFile<T>) => Promise<T>
  uploadPromise?: Promise<T>
  info?: FileInfo
  file?: formidable.File
  stream?: PassThrough
  validationError?: ValidationError

  constructor(
    options: Pick<
      ExpectedFormFile<T>,
      'formName' | 'required' | 'expectedMimeType' | 'validate' | 'onUpload'
    >
  ) {
    this.formName = options.formName
    this.required = options.required
    this.expectedMimeType = options.expectedMimeType
    this.validate = options.validate
    this.onUpload = options.onUpload
  }

  isValid() {
    return !!this.validationError
  }

  hasUploadPromise() {
    return !!this.uploadPromise
  }

  async getUploadPromise(): Promise<T> {
    const value = await this.uploadPromise
    return value as unknown as T
  }
}

export class ExpectedFormField {
  formName: string
  required?: boolean
  validate?: (
    fieldValue: string | string[],
    fieldName?: string
  ) => void | Promise<void>
  value?: string | string[]
  validationError?: ValidationError

  constructor(
    options: Pick<ExpectedFormField, 'formName' | 'required' | 'validate'>
  ) {
    this.formName = options.formName
    this.required = options.required
    this.validate = options.validate
  }

  isValid() {
    return !!this.validationError
  }
}

const validateFormFile = (file: ExpectedFormFile<unknown>): void => {
  if (file.expectedMimeType) {
    const actualMimeType = file.info?.mimeType || ''
    if (typeof file.expectedMimeType === 'string') {
      const stringPattern = file.expectedMimeType as string
      if (stringPattern.includes('*')) {
        const isMatch = wildcardMatch(stringPattern)
        if (!isMatch(actualMimeType)) {
          throw new ValidationError(
            `The expected mime pattern of ${stringPattern} for file "${file.formName}" was not met`,
            {
              type: 'pattern',
              path: file.formName,
              value: actualMimeType,
            }
          )
        }
      } else if (stringPattern !== actualMimeType) {
        throw new ValidationError(
          `The expected mime pattern of ${stringPattern} for file "${file.formName}" was not met`,
          {
            type: 'pattern',
            path: file.formName,
            value: actualMimeType,
          }
        )
      }
    } else if (file.expectedMimeType instanceof RegExp) {
      const mimeTypeRegex = file.expectedMimeType as RegExp
      if (!mimeTypeRegex.test(actualMimeType)) {
        throw new ValidationError(
          `The expected mime pattern of ${mimeTypeRegex} for file "${file.formName}" was not met`,
          {
            type: 'pattern',
            path: file.formName,
            value: actualMimeType,
          }
        )
      }
    }
  }

  if (file.validate) {
    file.validate(file)
  }
}

export class ParsedHttpForm {
  fields: Record<string, ExpectedFormField | null | undefined>
  files: Record<string, ExpectedFormFile<unknown> | null | undefined>
  validationErrors: ValidationError[]
  constructor(
    options: Pick<ParsedHttpForm, 'fields' | 'files' | 'validationErrors'>
  ) {
    this.fields = options?.fields || {}
    this.files = options?.files || {}
    this.validationErrors = options?.validationErrors || []
  }

  isValid() {
    return !!this.validationErrors?.length
  }

  static async fromRequest(
    req: Request,
    options: ParseRequestFormOptions
  ): Promise<ParsedHttpForm> {
    return new Promise((resolve, reject) => {
      const formFiles = {} as Record<string, ExpectedFormFile<unknown>>
      const formFields = {} as Record<string, ExpectedFormField>
      const validationErrors: ValidationError[] = []
      const handleFileUpload = (file: formidable.File) => {
        const pass = new PassThrough()
        const formFile = Object.values(formFiles).find(
          (f) => file === (f as ExpectedFormFile<unknown>).file
        )
        if (!formFile) {
          return pass
        }
        formFile.stream = pass
        if (formFile.onUpload) {
          try {
            formFile.uploadPromise = formFile.onUpload(pass, formFile)
          } catch (e) {
            const err = e as Error
            validationErrors.push(
              new ValidationError(err.message, {
                type: 'required',
                path: formFile.formName,
              })
            )
            return writableNoopStream()
          }
        } else if (options.onUpload) {
          try {
            formFile.uploadPromise = options.onUpload(pass, formFile)
          } catch (e) {
            const err = e as Error
            validationErrors.push(
              new ValidationError(err.message, {
                type: 'required',
                path: formFile.formName,
              })
            )
            return writableNoopStream()
          }
        }
        return pass
      }

      const form = formidable({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        fileWriteStreamHandler: handleFileUpload,
      })

      form.on('fileBegin', (formName, file) => {
        const fileInfo: FileInfo = {
          fileName: file.originalFilename,
          extension: file.originalFilename
            ? path.extname(file.originalFilename)
            : undefined,
          mimeType: file.mimetype || undefined,
          isImage: () =>
            file.mimetype?.toLowerCase().includes('image') || false,
          isVideo: () =>
            file.mimetype?.toLowerCase().includes('video') || false,
        }

        const expectedFile = options.expectedFiles?.find(
          (f) => f.formName === formName
        )

        let formFile: ExpectedFormFile<unknown>
        if (expectedFile) {
          formFile = expectedFile
          formFile.info = fileInfo
          formFile.file = file
          try {
            validateFormFile(expectedFile)
          } catch (e) {
            const err = e as ValidationError
            formFile.validationError = err
            validationErrors.push(err)
          }
        } else {
          formFile = new ExpectedFormFile<unknown>({
            formName,
          })
          formFile.info = fileInfo
          formFile.file = file
        }

        formFiles[formName] = formFile
      })

      form.parse(req, async (err, fields, files) => {
        if (err) {
          reject(err)
          return
        }

        if (options.expectedFiles) {
          const requiredFiles = options.expectedFiles.filter((f) => f.required)

          requiredFiles.forEach((f) => {
            const file = files[f.formName]
            if (!file) {
              validationErrors.push(
                new ValidationError(`The file "${f.formName}" is required`, {
                  type: 'required',
                  path: f.formName,
                })
              )
            }
          })
        }

        const fieldEntries = Object.entries(fields)

        if (options.expectedFields) {
          const requiredFields = options.expectedFields.filter(
            (f) => f.required
          )

          requiredFields.forEach((f) => {
            const value = fields[f.formName]
            if (!value) {
              validationErrors.push(
                new ValidationError(`The field "${f.formName}" is required`, {
                  type: 'required',
                  path: f.formName,
                })
              )
            }
          })

          for (let i = 0; i < fieldEntries.length; i++) {
            const [fieldName, fieldValue] = fieldEntries[i]

            const expectedField = options.expectedFields.find(
              (f) => f.formName === fieldName
            )

            let formField: ExpectedFormField
            if (expectedField) {
              formField = expectedField
            } else {
              formField = new ExpectedFormField({
                formName: fieldName,
              })
            }
            formField.value = fieldValue
            formFields[fieldName] = formField
            if (!expectedField?.validate) {
              continue
            }
            try {
              const validationResult = expectedField.validate(
                fieldValue,
                fieldName
              )
              if (validationResult instanceof Promise) {
                await validationResult
              }
            } catch (e) {
              const err = e as ValidationError
              formField.validationError = err
              validationErrors.push(err)
            }
          }
        }

        const form = new ParsedHttpForm({
          fields: formFields,
          files: formFiles,
          validationErrors: validationErrors,
        })

        resolve(form)
      })
    })
  }
}
