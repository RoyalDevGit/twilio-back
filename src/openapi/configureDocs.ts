import { Request, Response, NextFunction, Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import urlJoin from 'proper-url-join'

import { OpenApiSpec } from 'openapi'
import { Env } from 'utils/env'

const API_URL = Env.getString('API_URL')
const APP_URL = Env.getString('APP_URL')

export const configureDocs = (app: Express) => {
  app.use(
    '/swagger-ui',
    swaggerUi.serve,
    swaggerUi.setup(OpenApiSpec, {
      customSiteTitle: 'Expert Session API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  )

  app.get('/oas', [
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        res.status(200).json(OpenApiSpec)
      } catch (e) {
        next(e)
      }
    },
  ])

  app.get(
    '/docs',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        res.redirect('/')
      } catch (e) {
        next(e)
      }
    }
  )

  app.get(
    '/',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        res.status(200).send(/*html*/ `
          <!doctype html>
          <html>
            <head>
              <title>API Docs - Expert Session</title>
              <meta charset="utf-8">
              <link rel="icon" type="image/png" sizes="32x32" href="${urlJoin(
                APP_URL,
                '/favicon-32x32.png'
              )}">
              <link rel="icon" type="image/png" sizes="32x32" href="${urlJoin(
                APP_URL,
                '/favicon-16x16.png'
              )}">
              <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
              <style>
                rapi-doc::part(section-navbar) {
                  background: linear-gradient(56deg, #090B1B, #005ffe);
                }
              </style>
            </head>
            <body>
              <rapi-doc 
                spec-url="${urlJoin(API_URL, 'oas')}" 
                render-style="focused"
                layout="column"
                persist-auth="true"
                allow-spec-url-load="false"
                allow-server-selection="false"
                show-header="false"
                show-components="true"
                sort-tags="true"
                bg-color="#090B1B"
                text-color="#FFFFFF"
                primary-color="#3FA3FF"
                schema-description-expanded="true"
                schema-expand-level="1"></rapi-doc>
            </body>
          </html>
        `)
      } catch (e) {
        next(e)
      }
    }
  )
}
