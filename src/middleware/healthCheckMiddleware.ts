import { Request, Response, NextFunction, Express } from 'express'

export const configureHealthCheck = (app: Express) => {
  app.get('/healthcheck', [
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        res.status(200).json({
          status: 'running',
        })
      } catch (e) {
        next(e)
      }
    },
  ])
}
