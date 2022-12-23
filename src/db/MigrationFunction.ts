import mongo from 'mongodb'

export type MigrationFunction =
  | ((db: mongo.Db, client: mongo.MongoClient) => Promise<void>)
  /**
   * @deprecated Callbacks are supported for backwards compatibility.
   * New migration scripts should be written using `Promise`s and/or `async` & `await`. It's easier to read and write.
   */
  | ((db: mongo.Db, next: mongo.Callback) => void)
  /**
   * @deprecated Callbacks are supported for backwards compatibility.
   * New migration scripts should be written using `Promise`s and/or `async` & `await`. It's easier to read and write.
   */
  | ((db: mongo.Db, client: mongo.MongoClient, next: mongo.Callback) => void)
