import type { DocumentRecord, AnalyticsData, User, ExtractionField, LineItem, DocumentStatus } from '../types';

const API_BASE = '/api';

/**
 * Get current stored auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('idp_auth_token') || 'demo-token';
};

/**
 * Fetch wrapper with Authorization header
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Pass demo header if demo token
  if (token === 'demo-token') {
    headers.set('x-demo-mode', 'true');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data.data;
}

export const api = {
  auth: {
    async login(email: string, password: string): Promise<{ user: User; token: string }> {
      const data = await request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (data.token) {
        localStorage.setItem('idp_auth_token', data.token);
      }
      return data;
    },

    async register(email: string, password: string, full_name?: string): Promise<{ user: User; token: string }> {
      const data = await request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name })
      });
      if (data.token) {
        localStorage.setItem('idp_auth_token', data.token);
      }
      return data;
    },

    async getMe(): Promise<{ user: User }> {
      return request<{ user: User }>('/auth/me');
    },

    logout() {
      localStorage.removeItem('idp_auth_token');
    }
  },

  documents: {
    async list(params: {
      page?: number;
      limit?: number;
      status?: string;
      document_class?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    } = {}): Promise<{ documents: DocumentRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.status && params.status !== 'all') query.set('status', params.status);
      if (params.document_class && params.document_class !== 'all') query.set('document_class', params.document_class);
      if (params.search) query.set('search', params.search);
      if (params.sortBy) query.set('sortBy', params.sortBy);
      if (params.sortOrder) query.set('sortOrder', params.sortOrder);

      const qs = query.toString() ? `?${query.toString()}` : '';
      return request(`/documents${qs}`);
    },

    async getById(id: string): Promise<DocumentRecord> {
      return request<DocumentRecord>(`/documents/${id}`);
    },

    async upload(formData: FormData): Promise<{ documents: DocumentRecord[]; total: number }> {
      const token = getAuthToken();
      const headers = new Headers();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (token === 'demo-token') headers.set('x-demo-mode', 'true');

      const response = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'File upload failed');
      }
      return data.data;
    },

    async reExtract(id: string): Promise<DocumentRecord> {
      return request<DocumentRecord>(`/documents/${id}/extract`, {
        method: 'POST'
      });
    },

    async updateFields(
      id: string,
      payload: {
        fields?: Partial<ExtractionField>[];
        line_items?: LineItem[];
        status?: DocumentStatus;
        notes?: string;
      }
    ): Promise<DocumentRecord> {
      return request<DocumentRecord>(`/documents/${id}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    },

    async delete(id: string): Promise<void> {
      await request(`/documents/${id}`, {
        method: 'DELETE'
      });
    },

    getExportUrl(id: string, format: 'csv' | 'json' = 'csv'): string {
      const token = getAuthToken();
      return `${API_BASE}/documents/${id}/export?format=${format}&token=${encodeURIComponent(token || '')}`;
    },

    async downloadExport(id: string, format: 'csv' | 'json' = 'csv', fileName: string) {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/documents/${id}/export?format=${format}`, { headers });
      if (!res.ok) throw new Error('Export download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName.replace(/\.[^/.]+$/, '')}_extracted.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
  },

  analytics: {
    async get(): Promise<AnalyticsData> {
      return request<AnalyticsData>('/analytics');
    }
  }
};
