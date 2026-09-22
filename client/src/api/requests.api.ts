import { apiClient, toQueryString } from './client';
import { RequestItem, PaginatedRequests, RequestFilters } from '../types/request.types';

export interface CreateRequestPayload {
  name: string;
  comment?: string;
}

export interface CreateRequestAdminPayload {
  name: string;
  status?: string;
  comment?: string;
  recommendedById?: number;
  mediaId?: number;
}

export interface UpdateRequestPayload {
  name?: string;
  status?: string;
  comment?: string | null;
  recommendedById?: number | null;
  mediaId?: number | null;
}

export const requestsApi = {
  findAll: (page = 1, filters: RequestFilters = {}): Promise<PaginatedRequests> =>
    apiClient.get<PaginatedRequests>(`/requests${toQueryString({ page, ...filters })}`),

  create: (payload: CreateRequestPayload): Promise<RequestItem> =>
    apiClient.post<RequestItem>('/requests', payload),

  createAsAdmin: (payload: CreateRequestAdminPayload): Promise<RequestItem> =>
    apiClient.post<RequestItem>('/requests/admin', payload),

  update: (id: number, payload: UpdateRequestPayload): Promise<RequestItem> =>
    apiClient.patch<RequestItem>(`/requests/${id}`, payload),

  remove: (id: number): Promise<void> =>
    apiClient.delete<void>(`/requests/${id}`),
};
