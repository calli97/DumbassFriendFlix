import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { UserOption } from '../../api/users.api';

interface MediaFiltersBarProps {
  name: string;
  onNameChange: (name: string) => void;
  recommendedById: string;
  onRecommendedByChange: (id: string) => void;
  users: UserOption[];
}

export function MediaFiltersBar({
  name,
  onNameChange,
  recommendedById,
  onRecommendedByChange,
  users,
}: MediaFiltersBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Search by title…"
      />
      <Select
        label="Added by"
        value={recommendedById}
        onChange={onRecommendedByChange}
        options={[
          { value: '', label: '— All —' },
          ...users.map((u) => ({ value: String(u.id), label: u.username })),
        ]}
      />
    </div>
  );
}
