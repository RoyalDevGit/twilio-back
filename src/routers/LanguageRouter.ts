import express, { Request, Response, NextFunction } from 'express'
import isJSON from 'validator/lib/isJSON'

import { LanguageModel, Language, LanguageStatus } from 'models/Language'
import { Env } from 'utils/env'
import { AuthenticatedRequest } from 'interfaces/Express'
import { ApiError, ApiErrorCode, ValidationError } from 'utils/error/ApiError'
import {
  ExpectedFormField,
  ExpectedFormFile,
  ParsedHttpForm,
} from 'utils/http/form/ParsedHttpForm'
import { FileTrackerModel, FileTracker } from 'models/FileTracker'
import { parsePaginationParams } from 'utils/pagination/parsePaginationParams'
import { toQueryResponse } from 'utils/pagination/toQueryResponse'
import { getSystemAccount } from 'repositories/user/getSystemAccount'
import {
  languageSearch,
  reindexLanguages,
  removeFromLanguageIndex,
  updateLanguageIndex,
} from 'search/languageIndex'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { toMongooseSortDirection } from 'utils/mongoose/toMongooseSortDirection'
import { languagePopulationPaths } from 'repositories/language/languagePopulationPaths'

const AWS_S3_STORAGE_BUCKET = Env.getString('AWS_S3_STORAGE_BUCKET')

export const languageRouterPathPrefix = '/languages'
export const LanguageRouter = express.Router()

const ES_DRUPAL_KEY = Env.getString('ES_DRUPAL_KEY')

interface SearchLanguagesQueryParams {
  query: string
}

LanguageRouter.get('/search', [
  // ...requireAuthenticationMiddlewares({
  //   apiKey: ES_DRUPAL_KEY,
  // }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { query } =
      parseQueryStringFromRequest<SearchLanguagesQueryParams>(appReq)

    try {
      const result = await languageSearch(query || '')
      res.status(200).json(result)
    } catch (e) {
      next(e)
    }
  },
])

LanguageRouter.post('/reindex', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await reindexLanguages()
      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

interface GetLanguageParams {
  languageId: string
}

LanguageRouter.get('/', [
  ...requireAuthenticationMiddlewares({
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { query } = appReq
    const {
      page,
      limit,
      sort = 'name',
      sortDirection = 'asc',
    } = parsePaginationParams(query)

    try {
      const languages = await LanguageModel.paginate(
        {
          status: { $ne: LanguageStatus.Inactive },
        },
        {
          pagination: true,
          page,
          limit,
          sort: { [sort]: toMongooseSortDirection(sortDirection) },
          populate: languagePopulationPaths,
        }
      )

      res.status(200).json(toQueryResponse(languages))
    } catch (e) {
      next(e)
    }
  },
])

LanguageRouter.post('/', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const systemAccount = await getSystemAccount()
      const iconImage = new ExpectedFormFile<FileTracker>({
        formName: 'iconImage',
        expectedMimeType: 'image/*',
        onUpload: (stream, formFile) => {
          const file = FileTrackerModel.fromFormFile(formFile, {
            createdBy: systemAccount.id,
          })
          file.createdBy = systemAccount.id
          return file.uploadImage(AWS_S3_STORAGE_BUCKET, stream)
        },
      })

      const languageDataField = new ExpectedFormField({
        formName: 'languageData',
        required: true,
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('languageJsonIsNotValid', {
              path: 'languageData',
              type: 'pattern',
              value,
            })
          }
        },
      })

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        expectedFiles: [iconImage],
        expectedFields: [languageDataField],
      })

      if (validationErrors.length) {
        const error = new ApiError(
          'updateFormIsNotValid',
          ApiErrorCode.BadRequest
        )
        error.validationErrors = validationErrors
        res.status(400).json(error)
        return
      }

      let languageData: Partial<Language> = {}
      if (languageDataField.value) {
        languageData = JSON.parse(
          languageDataField.value as string
        ) as Partial<Language>
      }

      const existingLanguage = await LanguageModel.findOne({
        code: languageData.code,
      })
      if (existingLanguage) {
        throw new ApiError('languageAlreadyExists', ApiErrorCode.AlreadyExists)
      }

      const newIconImage = await iconImage?.getUploadPromise()
      if (newIconImage) {
        languageData.iconImage = newIconImage
      }

      const newLanguage = new LanguageModel(languageData)

      await newLanguage.save()
      await updateLanguageIndex(newLanguage)
      res.status(201).json(newLanguage)
    } catch (e) {
      next(e)
    }
  },
])

LanguageRouter.get('/:languageId', [
  ...requireAuthenticationMiddlewares({
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { languageId } = params as unknown as GetLanguageParams

    try {
      const language = await LanguageModel.findById(languageId)
      if (!language) {
        throw new ApiError('languageNotFound', ApiErrorCode.NotFound)
      }

      res.status(200).json(language)
    } catch (e) {
      next(e)
    }
  },
])

LanguageRouter.patch('/:languageId', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { languageId } = params

    try {
      const systemAccount = await getSystemAccount()
      const existingLanguage = await LanguageModel.findById(languageId)
      if (!existingLanguage) {
        throw new ApiError('languageNotFound', ApiErrorCode.NotFound)
      }

      const iconImage = new ExpectedFormFile<FileTracker>({
        formName: 'iconImage',
        expectedMimeType: 'image/*',
        onUpload: (stream, formFile) => {
          const file = FileTrackerModel.fromFormFile(formFile, {
            createdBy: systemAccount.id,
          })
          file.createdBy = systemAccount.id
          return file.uploadImage(AWS_S3_STORAGE_BUCKET, stream)
        },
      })

      const languageDataField = new ExpectedFormField({
        formName: 'languageData',
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('languageJsonIsNotValid', {
              path: 'languageData',
              type: 'pattern',
              value,
            })
          }
        },
      })

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        expectedFiles: [iconImage],
        expectedFields: [languageDataField],
      })

      if (validationErrors.length) {
        const error = new ApiError(
          'updateFormIsNotValid',
          ApiErrorCode.BadRequest
        )
        error.validationErrors = validationErrors
        res.status(400).json(error)
        return
      }

      let languageData: Partial<Language> = {}
      if (languageDataField.value) {
        languageData = JSON.parse(
          languageDataField.value as string
        ) as Partial<Language>
      }

      const newIconImage = await iconImage?.getUploadPromise()
      if (newIconImage) {
        languageData.iconImage = newIconImage
      }

      const updatedLanguage = (await LanguageModel.findByIdAndUpdate(
        existingLanguage._id,
        languageData,
        {
          new: true,
          runValidators: true,
        }
      )) as Language

      if (updatedLanguage.status === LanguageStatus.Inactive) {
        await removeFromLanguageIndex(updatedLanguage)
      } else {
        await updateLanguageIndex(updatedLanguage)
      }

      res.status(201).json(updatedLanguage)
    } catch (e) {
      next(e)
    }
  },
])
