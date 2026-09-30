import type { DocumentRecord, AnalyticsData, User, ExtractionField, LineItem, DocumentStatus } from '../types';
import { DEMO_USER, DEMO_DOCUMENTS, DEMO_ANALYTICS } from './demoData';

/**
 * Determine and sanitize API base URL from environment variables.
 * In production on Vercel, automatically targets the deployed Render backend
 * if VITE_API_BASE_URL is relative (/api) or unset, avoiding Vercel 404 HTML pages.
 */
export const getApiBaseUrl = (): string => {
  let raw = (import.meta.env.VITE_API_BASE_URL || '').trim();

  // If in browser on Vercel or any remote production domain, and VITE_API_BASE_URL is relative or default:
  // Automatically target the deployed backend on Render
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isRemoteProduction = host.includes('vercel.app') || (host !== 'localhost' && host !== '127.0.0.1');
    if (isRemoteProduction && (!raw || raw === '/api' || raw.startsWith('sb_'))) {
      return 'https://idp-backend-vl5r.onrender.com/api';
    }
  }

  // Fallback for local development or missing configuration
  if (!raw || raw.startsWith('sb_')) {
    raw = '/api';
  }

  // Remove trailing slashes
  raw = raw.replace(/\/+$/, '');

  // If absolute URL without trailing /api, append /api
  if ((raw.startsWith('http://') || raw.startsWith('https://')) && !raw.endsWith('/api')) {
    raw += '/api';
  }

  return raw;
};

/**
 * Construct full URL ensuring no duplicate '/api/api' path segments
 */
export const buildApiUrl = (endpoint: string): string => {
  const base = getApiBaseUrl();
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If base already ends with /api, and endpoint starts with /api/, strip leading /api
  if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.replace(/^\/api/, '');
  }

  if (base.endsWith('/api') && cleanEndpoint === '/api') {
    return base;
  }

  return `${base}${cleanEndpoint}`;
};

/**
 * Get current stored auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('idp_auth_token') || 'demo-token';
};

/**
 * Retrieve simulated demo data for offline resilience and cold-start fallback
 */
function getDemoFallback<T>(endpoint: string): T | null {
  const cleanEndpoint = endpoint.split('?')[0].replace(/^\/api/, '');
  if (cleanEndpoint === '/auth/me' || cleanEndpoint === '/auth/demo') {
    return { user: DEMO_USER } as unknown as T;
  }
  if (cleanEndpoint === '/documents' || cleanEndpoint === '') {
    return {
      documents: DEMO_DOCUMENTS,
      pagination: { page: 1, limit: 10, total: DEMO_DOCUMENTS.length, totalPages: 1 }
    } as unknown as T;
  }
  if (cleanEndpoint.startsWith('/documents/')) {
    const parts = cleanEndpoint.split('/');
    const docId = parts[2];
    const match = DEMO_DOCUMENTS.find(d => d.id === docId) || DEMO_DOCUMENTS[0];
    return match as unknown as T;
  }
  if (cleanEndpoint === '/analytics') {
    return DEMO_ANALYTICS as unknown as T;
  }
  if (cleanEndpoint === '/health' || cleanEndpoint === '/api/health') {
    return {
      status: 'online',
      services: { supabase: 'connected (demo)', gemini_vision: 'active (gemini-2.0-flash)' }
    } as unknown as T;
  }
  return null;
}

/**
 * Safe parser for HTTP responses:
 * Strictly checks Content-Type header before attempting response.json()
 * to prevent "Unexpected token 'T', 'The page c'... is not valid JSON".
 */
async function safeParseResponse<T>(response: Response, endpoint: string, isDemo: boolean): Promise<T> {
  const contentType = response.headers.get('content-type') || '';

  // 1. Verify response is JSON before calling response.json()
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    const cleanSnippet = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);

    // If demo mode and server is cold starting, use rich preloaded demo dataset
    if (isDemo) {
      const fallback = getDemoFallback<T>(endpoint);
      if (fallback !== null) return fallback;
    }

    throw new Error(
      `Server returned non-JSON response (${response.status} ${response.statusText}): ${cleanSnippet || 'The page could not be found or returned an HTML error'}`
    );
  }

  // 2. Safe JSON parsing with fallback
  let data: any = null;
  try {
    data = await response.json();
  } catch (parseErr: any) {
    if (isDemo) {
      const fallback = getDemoFallback<T>(endpoint);
      if (fallback !== null) return fallback;
    }
    throw new Error(`Failed to parse server JSON response: ${parseErr.message}`);
  }

  // 3. Handle explicit API failure flags
  if (!response.ok || (data && data.success === false)) {
    if (isDemo && response.status >= 500) {
      const fallback = getDemoFallback<T>(endpoint);
      if (fallback !== null) return fallback;
    }
    const errorMsg = data?.message || `Request failed with HTTP status ${response.status} (${response.statusText})`;
    throw new Error(errorMsg);
  }

  return data ? data.data : (null as any);
}

/**
 * Fetch wrapper with Authorization header, safe JSON/HTML response handling,
 * and seamless fallback for demo user evaluation during cold starts.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const isDemo = token === 'demo-token';
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (isDemo) {
    headers.set('x-demo-mode', 'true');
  }

  const url = buildApiUrl(endpoint);
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkErr: any) {
    if (isDemo) {
      const fallback = getDemoFallback<T>(endpoint);
      if (fallback !== null) return fallback;
    }
    throw new Error(
      `Failed to connect to backend server at ${url}. If using Render free tier, the instance may be spinning up from sleep (~30 seconds). Details: ${networkErr.message}`
    );
  }

  return safeParseResponse<T>(response, endpoint, isDemo);
}

export const api = {
  health: {
    async check(): Promise<any> {
      return request('/health');
    }
  },

  auth: {
    async login(email: string, password: string): Promise<{ user: User; token: string }> {
      const isDemo = email === DEMO_USER.email || email === 'demo@cineforge.ai' || email === 'demo@idp.com';
      if (isDemo) {
        localStorage.setItem('idp_auth_token', 'demo-token');
        return { user: DEMO_USER, token: 'demo-token' };
      }

      const data = await request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (data?.token) {
        localStorage.setItem('idp_auth_token', data.token);
      }
      return data;
    },

    async demo(): Promise<{ user: User; token: string }> {
      localStorage.setItem('idp_auth_token', 'demo-token');
      try {
        const data = await request<{ user: User; token: string }>('/auth/demo', { method: 'POST' });
        return data || { user: DEMO_USER, token: 'demo-token' };
      } catch {
        return { user: DEMO_USER, token: 'demo-token' };
      }
    },

    async register(email: string, password: string, full_name?: string): Promise<{ user: User; token: string }> {
      const data = await request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name })
      });
      if (data?.token) {
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
      const isDemo = token === 'demo-token';
      const headers = new Headers();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (isDemo) headers.set('x-demo-mode', 'true');

      const url = buildApiUrl('/documents/upload');
      let response: Response;

      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
      } catch (networkErr: any) {
        if (isDemo) {
          return { documents: DEMO_DOCUMENTS.slice(0, 1), total: 1 };
        }
        throw new Error(
          `Unable to connect to upload service at ${url}. ${networkErr.message}`
        );
      }

      return safeParseResponse<{ documents: DocumentRecord[]; total: number }>(response, '/documents/upload', isDemo);
    },

    async directExtract(formData: FormData): Promise<any> {
      const token = getAuthToken();
      const isDemo = token === 'demo-token';
      const headers = new Headers();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (isDemo) headers.set('x-demo-mode', 'true');

      const url = buildApiUrl('/extract');
      let response: Response;

      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
      } catch (networkErr: any) {
        if (isDemo) {
          return DEMO_DOCUMENTS[0].extraction;
        }
        throw new Error(`Extraction service network failure at ${url}: ${networkErr.message}`);
      }

      return safeParseResponse<any>(response, '/extract', isDemo);
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
      const url = buildApiUrl(`/documents/${id}/export`);
      return `${url}?format=${format}&token=${encodeURIComponent(token || '')}`;
    },

    async downloadExport(id: string, format: 'csv' | 'json' = 'csv', fileName: string) {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = buildApiUrl(`/documents/${id}/export?format=${format}`);
      let res: Response;

      try {
        res = await fetch(url, { headers });
      } catch (err: any) {
        throw new Error(`Export network failure at ${url}: ${err.message}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || contentType.includes('text/html')) {
        const text = await res.text();
        const snippet = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
        throw new Error(`Export download failed (${res.status}): ${snippet || 'Server returned HTML error'}`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${fileName.replace(/\.[^/.]+$/, '')}_extracted.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    }
  },

  analytics: {
    async get(): Promise<AnalyticsData> {
      return request<AnalyticsData>('/analytics');
    }
  }
};
