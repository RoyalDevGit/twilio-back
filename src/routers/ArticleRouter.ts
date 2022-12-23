import express, { Request, Response, NextFunction } from 'express'
import isJSON from 'validator/lib/isJSON'

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
import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import {
  articleSearch,
  reindexArticles,
  removeFromArticleIndex,
  updateArticleIndex,
} from 'search/articleIndex'
import { Article, ArticleModel, ArticleStatus } from 'models/Article'
import { queryArticles } from 'repositories/articles/queryArticles'
import { CategoryModel } from 'models/Category'

const AWS_S3_STORAGE_BUCKET = Env.getString('AWS_S3_STORAGE_BUCKET')

export const articleRouterPathPrefix = '/articles'
export const ArticleRouter = express.Router()

const ES_DRUPAL_KEY = Env.getString('ES_DRUPAL_KEY')

interface GetCategoryParams {
  articleId: string
}

interface SearchSubCategoriesQueryParams {
  query: string
}

ArticleRouter.get('/articles/search', [
  ...requireAuthenticationMiddlewares({
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { query } =
      parseQueryStringFromRequest<SearchSubCategoriesQueryParams>(appReq)

    try {
      const result = await articleSearch(query || '')
      res.status(200).json(result)
    } catch (e) {
      next(e)
    }
  },
])

interface QueryCategoriesQueryParams {
  only?: 'parents' | 'categories'
}

ArticleRouter.get('/', [
  ...requireAuthenticationMiddlewares({ apiKey: ES_DRUPAL_KEY }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { query } = appReq
    const queryRequest = parsePaginationParams(query)
    const { only } =
      parseQueryStringFromRequest<QueryCategoriesQueryParams>(appReq)

    try {
      const categories = await queryArticles({ queryRequest, only })
      res.status(200).json(categories)
    } catch (e) {
      next(e)
    }
  },
])

ArticleRouter.post('/articles/reindex', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await reindexArticles()
      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

ArticleRouter.post('/', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user: systemAccount } = appReq

    console.log('making it in...')
    try {
      const thumbnail = new ExpectedFormFile<FileTracker>({
        formName: 'thumbnail',
        expectedMimeType: 'image/*',
        onUpload: (stream, formFile) => {
          const file = FileTrackerModel.fromFormFile(formFile, {
            createdBy: systemAccount.id,
          })
          file.createdBy = systemAccount.id
          return file.uploadImage(AWS_S3_STORAGE_BUCKET, stream)
        },
      })

      const heroImage = new ExpectedFormFile<FileTracker>({
        formName: 'heroImage',
        expectedMimeType: 'image/*',
        onUpload: (stream, formFile) => {
          const file = FileTrackerModel.fromFormFile(formFile, {
            createdBy: systemAccount.id,
          })
          file.createdBy = systemAccount.id
          return file.uploadImage(AWS_S3_STORAGE_BUCKET, stream)
        },
      })

      const articleDataField = new ExpectedFormField({
        formName: 'articleData',
        required: true,
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('articleJsonIsNotValid', {
              path: 'articleData',
              type: 'pattern',
              value,
            })
          }
        },
      })

      console.log(req.body)

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        expectedFiles: [thumbnail, heroImage],
        expectedFields: [articleDataField],
      })

      console.log('validationErrors', validationErrors)

      if (validationErrors.length) {
        const error = new ApiError(
          'updateFormIsNotValid',
          ApiErrorCode.BadRequest
        )
        error.validationErrors = validationErrors
        res.status(400).json(error)
        return
      }

      let articleData: Partial<Article> = {}
      if (articleDataField.value) {
        articleData = JSON.parse(
          articleDataField.value as string
        ) as Partial<Article>

        if (articleData.category) {
          const category = await CategoryModel.findById(articleData.category)
          if (!category) {
            throw new ApiError('categoryNotFound', ApiErrorCode.NotFound)
          }
        }
      }

      const existingArticle = await ArticleModel.findOne({
        code: articleData.code,
      })
      if (existingArticle) {
        throw new ApiError('articleAlreadyExists', ApiErrorCode.AlreadyExists)
      }

      const newthumbnail = await thumbnail?.getUploadPromise()
      if (newthumbnail) {
        articleData.thumbnail = newthumbnail
      }
      const newHeroImage = await heroImage?.getUploadPromise()
      if (newHeroImage) {
        articleData.heroImage = newHeroImage
      }

      const newArticle = new ArticleModel(articleData)

      await newArticle.save()
      if (newArticle.category) {
        await updateArticleIndex(newArticle)
      }
      res.status(201).json(newArticle)
    } catch (e) {
      console.log('alsdkfjasdf', e)
      next(e)
    }
  },
])

ArticleRouter.get('/:articleId', [
  ...requireAuthenticationMiddlewares({
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { articleId } = params as unknown as GetCategoryParams

    try {
      const article = await ArticleModel.findById(articleId)
      if (!article) {
        throw new ApiError('articleNotFound', ApiErrorCode.NotFound)
      }

      res.status(200).json(article)
    } catch (e) {
      next(e)
    }
  },
])

ArticleRouter.patch('/:articleId', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user: systemAccount, params } = appReq
    const { articleId } = params

    try {
      const existingArticle = await ArticleModel.findById(articleId)
      if (!existingArticle) {
        throw new ApiError('articleNotFound', ApiErrorCode.NotFound)
      }

      const thumbnail = new ExpectedFormFile<FileTracker>({
        formName: 'thumbnail',
        expectedMimeType: 'image/*',
        onUpload: (stream, formFile) => {
          const file = FileTrackerModel.fromFormFile(formFile, {
            createdBy: systemAccount.id,
          })
          file.createdBy = systemAccount.id
          return file.uploadImage(AWS_S3_STORAGE_BUCKET, stream)
        },
      })

      const heroImage = new ExpectedFormFile<FileTracker>({
        formName: 'heroImage',
        expectedMimeType: 'image/*',
        onUpload: (stream, formFile) => {
          const file = FileTrackerModel.fromFormFile(formFile, {
            createdBy: systemAccount.id,
          })
          file.createdBy = systemAccount.id
          return file.uploadImage(AWS_S3_STORAGE_BUCKET, stream)
        },
      })

      const articleDataField = new ExpectedFormField({
        formName: 'articleData',
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('articleJsonIsNotValid', {
              path: 'articleData',
              type: 'pattern',
              value,
            })
          }
        },
      })

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        expectedFiles: [thumbnail, heroImage],
        expectedFields: [articleDataField],
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

      let articleData: Partial<Article> = {}
      if (articleDataField.value) {
        articleData = JSON.parse(
          articleDataField.value as string
        ) as Partial<Article>

        if (articleData.category) {
          const category = await CategoryModel.findById(articleData.category)
          if (!category) {
            throw new ApiError('categoryNotFound', ApiErrorCode.NotFound)
          }
        }
      }

      const newthumbnail = await thumbnail?.getUploadPromise()
      if (newthumbnail) {
        articleData.thumbnail = newthumbnail
      }
      const newHeroImage = await heroImage?.getUploadPromise()
      if (newHeroImage) {
        articleData.heroImage = newHeroImage
      }

      const updatedArticle = (await ArticleModel.findByIdAndUpdate(
        existingArticle._id,
        articleData,
        {
          new: true,
          runValidators: true,
        }
      )) as Article

      if (existingArticle.status === ArticleStatus.Inactive) {
        await removeFromArticleIndex(existingArticle)
      } else {
        if (existingArticle.category && !updatedArticle.category) {
          await removeFromArticleIndex(existingArticle)
        }

        if (updatedArticle.category) {
          await updateArticleIndex(updatedArticle)
        }
      }

      res.status(201).json(updatedArticle)
    } catch (e) {
      next(e)
    }
  },
])
