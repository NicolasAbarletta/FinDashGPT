// Tell TypeScript to accept any import from these CJS modules
declare module 'node-cron' {
  const whatever: any;
  export = whatever;
}

declare module 'better-sqlite3' {
  const Database: any;
  export = Database;
}
