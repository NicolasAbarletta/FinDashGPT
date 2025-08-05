// backend/src/backend/types.d.ts

// Declare modules that don’t ship with TypeScript definitions.
// This prevents “could not find a declaration file” errors.

declare module 'node-cron' {
  interface ScheduleOptions {
    timezone?: string;
  }
  type ScheduledTask = {
    start: () => void;
    stop: () => void;
  };
  function schedule(cronExpression: string, task: () => void, options?: ScheduleOptions): ScheduledTask;
  export = { schedule };
}

declare module 'uuid' {
  export function v4(): string;
}

declare module 'better-sqlite3' {
  class Database {
    constructor(filename: string, options?: any);
    prepare(sql: string): any;
    transaction(fn: (...args: any[]) => any): (...args: any[]) => any;
    exec(sql: string): void;
    close(): void;
  }
  export = Database;
}
