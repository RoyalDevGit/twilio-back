import express, { Request, Response, NextFunction } from 'express'
import isJSON from 'validator/lib/isJSON'

import { CategoryModel, Category, CategoryStatus } from 'models/Category'
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
import {
  reindexSubcategories,
  removeFromSubcategoryIndex,
  subCategorySearch,
  updateSubcategoryIndex,
} from 'search/subcategoryIndex'
import { requireAuthenticationMiddlewares } from 'middleware/authMiddleware'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import { queryCategories } from 'repositories/category/queryCategories'
import { queryRecommendedCategories } from 'repositories/category/queryRecommendedCategories'

const AWS_S3_STORAGE_BUCKET = Env.getString('AWS_S3_STORAGE_BUCKET')

export const categoryRouterPathPrefix = '/categories'
export const CategoryRouter = express.Router()

const ES_DRUPAL_KEY = Env.getString('ES_DRUPAL_KEY')

interface GetCategoryParams {
  categoryId: string
}

interface SearchSubCategoriesQueryParams {
  query: string
}

CategoryRouter.get('/subcategories/search', [
  ...requireAuthenticationMiddlewares({
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { query } =
      parseQueryStringFromRequest<SearchSubCategoriesQueryParams>(appReq)

    try {
      const result = await subCategorySearch(query || '')
      res.status(200).json(result)
    } catch (e) {
      next(e)
    }
  },
])

interface QueryCategoriesQueryParams {
  only?: 'parents' | 'subcategories'
}

CategoryRouter.get('/', [
  ...requireAuthenticationMiddlewares({ apiKey: ES_DRUPAL_KEY }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { query } = appReq
    const queryRequest = parsePaginationParams(query)
    const { only } =
      parseQueryStringFromRequest<QueryCategoriesQueryParams>(appReq)

    try {
      const categories = await queryCategories({ queryRequest, only })
      res.status(200).json(categories)
    } catch (e) {
      next(e)
    }
  },
])

CategoryRouter.get('/recommended', [
  // ...requireAuthenticationMiddlewares({ apiKey: ES_DRUPAL_KEY }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { query } = appReq
    const queryRequest = parsePaginationParams(query)

    try {
      const categories = await queryRecommendedCategories(queryRequest)
      res.status(200).json(categories)
    } catch (e) {
      next(e)
    }
  },
])

CategoryRouter.post('/subcategories/reindex', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await reindexSubcategories()
      res.sendStatus(204)
    } catch (e) {
      next(e)
    }
  },
])

CategoryRouter.post('/', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user: systemAccount } = appReq

    try {
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

      const categoryDataField = new ExpectedFormField({
        formName: 'categoryData',
        required: true,
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('categoryJsonIsNotValid', {
              path: 'categoryData',
              type: 'pattern',
              value,
            })
          }
        },
      })

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        expectedFiles: [iconImage, heroImage],
        expectedFields: [categoryDataField],
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

      let categoryData: Partial<Category> = {}
      if (categoryDataField.value) {
        categoryData = JSON.parse(
          categoryDataField.value as string
        ) as Partial<Category>

        if (categoryData.parentCategory) {
          const parentCategory = await CategoryModel.findById(
            categoryData.parentCategory
          )
          if (!parentCategory) {
            throw new ApiError('parentCategoryNotFound', ApiErrorCode.NotFound)
          }
        }
      }

      const existingCategory = await CategoryModel.findOne({
        code: categoryData.code,
      })
      if (existingCategory) {
        throw new ApiError('categoryAlreadyExists', ApiErrorCode.AlreadyExists)
      }

      const newIconImage = await iconImage?.getUploadPromise()
      if (newIconImage) {
        categoryData.iconImage = newIconImage
      }
      const newHeroImage = await heroImage?.getUploadPromise()
      if (newHeroImage) {
        categoryData.heroImage = newHeroImage
      }

      const newCategory = new CategoryModel(categoryData)

      await newCategory.save()
      if (newCategory.parentCategory) {
        await updateSubcategoryIndex(newCategory)
      }
      res.status(201).json(newCategory)
    } catch (e) {
      next(e)
    }
  },
])

CategoryRouter.get('/:categoryId', [
  ...requireAuthenticationMiddlewares({
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { params } = appReq
    const { categoryId } = params as unknown as GetCategoryParams

    try {
      const category = await CategoryModel.findById(categoryId)
      if (!category) {
        throw new ApiError('categoryNotFound', ApiErrorCode.NotFound)
      }

      res.status(200).json(category)
    } catch (e) {
      next(e)
    }
  },
])

CategoryRouter.patch('/:categoryId', [
  ...requireAuthenticationMiddlewares({
    allowBearerToken: false,
    apiKey: ES_DRUPAL_KEY,
  }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { user: systemAccount, params } = appReq
    const { categoryId } = params

    try {
      const existingCategory = await CategoryModel.findById(categoryId)
      if (!existingCategory) {
        throw new ApiError('categoryNotFound', ApiErrorCode.NotFound)
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

      const categoryDataField = new ExpectedFormField({
        formName: 'categoryData',
        validate: (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (!isJSON(value as string, { allow_primitives: false })) {
            throw new ValidationError('categoryJsonIsNotValid', {
              path: 'categoryData',
              type: 'pattern',
              value,
            })
          }
        },
      })

      const { validationErrors } = await ParsedHttpForm.fromRequest(req, {
        expectedFiles: [iconImage, heroImage],
        expectedFields: [categoryDataField],
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

      let categoryData: Partial<Category> = {}
      if (categoryDataField.value) {
        categoryData = JSON.parse(
          categoryDataField.value as string
        ) as Partial<Category>

        if (categoryData.parentCategory === categoryId) {
          throw new ApiError(
            'recursiveCategoriesAreNotAllowed',
            ApiErrorCode.NotFound
          )
        }

        if (categoryData.parentCategory) {
          const parentCategory = await CategoryModel.findById(
            categoryData.parentCategory
          )
          if (!parentCategory) {
            throw new ApiError('parentCategoryNotFound', ApiErrorCode.NotFound)
          }
        }
      }

      const newIconImage = await iconImage?.getUploadPromise()
      if (newIconImage) {
        categoryData.iconImage = newIconImage
      }
      const newHeroImage = await heroImage?.getUploadPromise()
      if (newHeroImage) {
        categoryData.heroImage = newHeroImage
      }

      const updatedCategory = (await CategoryModel.findByIdAndUpdate(
        existingCategory._id,
        categoryData,
        {
          new: true,
          runValidators: true,
        }
      )) as Category

      if (existingCategory.status === CategoryStatus.Inactive) {
        await removeFromSubcategoryIndex(existingCategory)
      } else {
        if (
          existingCategory.parentCategory &&
          !updatedCategory.parentCategory
        ) {
          await removeFromSubcategoryIndex(existingCategory)
        }

        if (updatedCategory.parentCategory) {
          await updateSubcategoryIndex(updatedCategory)
        }
      }

      res.status(201).json(updatedCategory)
    } catch (e) {
      next(e)
    }
  },
])
