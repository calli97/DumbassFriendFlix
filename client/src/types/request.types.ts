import { User } from './auth.types';
import { Media } from './media.types';

export type RequestStatus = 'Pending' | 'Complete';

export interface RequestItem {
  id: number;
  name: string;
  status: RequestStatus;
  comment: string | null;
  mediaLinked: Media | null;
  recommendedBy: User | null;
  createdAt: string;
}

export interface PaginatedRequests {
  data: RequestItem[];
  total: number;
  page: number;
  limit: number;
}
