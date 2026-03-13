import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { usersApi } from '../../api/users.api';
import { User, RoleName } from '../../types/auth.types';
import { ApiError } from '../../api/client';

const ALL_ROLES: RoleName[] = ['USER', 'ADMIN'];

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  /** If provided the modal is in edit mode; otherwise create mode */
  user?: User;
  onSuccess: (user: User) => void;
}

export function UserFormModal({ open, onClose, user, onSuccess }: UserFormModalProps) {
  const isEdit = Boolean(user);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<RoleName[]>(['USER']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Populate fields when opening in edit mode
  useEffect(() => {
    if (open && user) {
      setUsername(user.username);
      setEmail(user.email);
      setPassword('');
      setRoles(user.roles.map((r) => r.name));
    } else if (open) {
      setUsername('');
      setEmail('');
      setPassword('');
      setRoles(['USER']);
    }
    setError('');
  }, [open, user]);

  function toggleRole(role: RoleName) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (roles.length === 0) {
      setError('At least one role must be selected');
      return;
    }

    setLoading(true);
    try {
      let saved: User;

      if (isEdit && user) {
        const payload: Record<string, unknown> = { username, email, roles };
        if (password) payload.password = password;
        saved = await usersApi.update(user.id, payload);
      } else {
        saved = await usersApi.create({ username, email, password, roles });
      }

      onSuccess(saved);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'New User'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-3 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={100}
          placeholder="johndoe"
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
        />

        <Input
          label={isEdit ? 'New Password' : 'Password'}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!isEdit}
          minLength={8}
          placeholder="••••••••"
          helperText={isEdit ? 'Leave blank to keep the current password' : 'Minimum 8 characters'}
        />

        {/* Role checkboxes */}
        <fieldset>
          <legend className="text-sm font-medium text-slate-700 mb-2">Roles</legend>
          <div className="flex gap-4">
            {ALL_ROLES.map((role) => (
              <label key={role} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={roles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                />
                <span className="text-sm text-slate-700">{role}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
