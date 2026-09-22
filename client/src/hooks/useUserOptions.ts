import { useEffect, useState } from 'react';
import { usersApi, UserOption } from '../api/users.api';

/** Loads the minimal user list used by "added by" filter selectors. */
export function useUserOptions(): UserOption[] {
  const [users, setUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    usersApi.findOptions().then(setUsers).catch(() => {});
  }, []);

  return users;
}
