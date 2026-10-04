import {
  Commitment,
  CommitmentProposal,
  DashboardSummary,
  InAppNotification,
  IntegrationHealth,
  Person,
  User,
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('promisepocket_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('promisepocket_token', token);
    } else {
      localStorage.removeItem('promisepocket_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // If unauthorized, clear token
        this.setToken(null);
      }

      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // ignore json parse error
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (err: any) {
      console.warn(`API request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // Auth
  async login(email: string, password?: string) {
    const data = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password || 'demo1234' }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async loginDemo() {
    const data = await this.request<{ access_token: string; user: User }>('/auth/demo', {
      method: 'POST',
    });
    this.setToken(data.access_token);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/dashboard/summary');
  }

  // Commitments
  async getCommitments(params?: {
    status?: string;
    person_id?: string;
    category?: string;
    search?: string;
  }): Promise<Commitment[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.person_id) query.set('person_id', params.person_id);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<Commitment[]>(`/commitments${queryString}`);
  }

  async getCommitment(id: string): Promise<Commitment> {
    return this.request<Commitment>(`/commitments/${id}`);
  }

  async createCommitment(data: Partial<Commitment>): Promise<Commitment> {
    return this.request<Commitment>('/commitments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCommitment(id: string, data: Partial<Commitment>): Promise<Commitment> {
    return this.request<Commitment>(`/commitments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async completeCommitment(id: string, note?: string): Promise<Commitment> {
    return this.request<Commitment>(`/commitments/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  async cancelCommitment(id: string): Promise<Commitment> {
    return this.request<Commitment>(`/commitments/${id}/cancel`, {
      method: 'POST',
    });
  }

  async deleteCommitment(id: string): Promise<void> {
    return this.request<void>(`/commitments/${id}`, {
      method: 'DELETE',
    });
  }

  // Assistant & Extraction
  async sendAssistantMessage(message: string, timezone: string): Promise<{
    reply: string;
    proposals?: CommitmentProposal[];
    citations?: any[];
  }> {
    return this.request('/assistant/message', {
      method: 'POST',
      body: JSON.stringify({ message, timezone }),
    });
  }

  async extractCommitments(text: string, timezone: string): Promise<{
    proposals: CommitmentProposal[];
    intent: string;
  }> {
    return this.request('/assistant/extract', {
      method: 'POST',
      body: JSON.stringify({ text, timezone }),
    });
  }

  async confirmProposal(proposal: CommitmentProposal): Promise<{
    commitment: Commitment;
    reminder_status: string;
  }> {
    return this.request('/assistant/confirm', {
      method: 'POST',
      body: JSON.stringify({ proposal }),
    });
  }

  // People
  async getPeople(): Promise<Person[]> {
    return this.request<Person[]>('/people');
  }

  async createPerson(name: string, relationship?: string): Promise<Person> {
    return this.request<Person>('/people', {
      method: 'POST',
      body: JSON.stringify({ name, relationship }),
    });
  }

  async updatePerson(id: string, data: Partial<Person>): Promise<Person> {
    return this.request<Person>(`/people/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePerson(id: string): Promise<void> {
    return this.request<void>(`/people/${id}`, {
      method: 'DELETE',
    });
  }

  // Calendar
  async getCalendarEvents(year: number, month: number): Promise<{
    year: number;
    month: number;
    events: Commitment[];
  }> {
    return this.request(`/calendar/events?year=${year}&month=${month}`);
  }

  // Notifications
  async getNotifications(): Promise<InAppNotification[]> {
    return this.request<InAppNotification[]>('/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    return this.request(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  // Voice
  async transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice_recording.webm');
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const response = await fetch(`${API_BASE}/voice/transcribe`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`Voice transcription failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Settings & System
  async getSettings(): Promise<any> {
    return this.request('/settings');
  }

  async updateSettings(data: any): Promise<any> {
    return this.request('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    return this.request('/settings/reset_demo', {
      method: 'POST',
    });
  }

  async getHealth(): Promise<IntegrationHealth> {
    try {
      const response = await fetch('/health');
      if (response.ok) return await response.json();
    } catch {
      // fallback
    }
    return {
      ollama_connected: false,
      mongodb_connected: false,
      temporal_connected: false,
      elevenlabs_configured: false,
      render_ready: true,
      mode: 'demo',
    };
  }
}

export const api = new ApiClient();
