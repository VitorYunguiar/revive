// Serialize local event creation and online habit edits for the account.
const operations = new Map<string, Promise<unknown>>();
export const withHabitOperationLock = async <T,>(userId: string, action: () => Promise<T>): Promise<T> => {
  const previous = operations.get(userId) || Promise.resolve();
  const next = previous.catch(() => undefined).then(action);
  operations.set(userId, next);
  try { return await next; } finally { if (operations.get(userId) === next) operations.delete(userId); }
};
