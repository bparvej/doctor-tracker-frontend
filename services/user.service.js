import { api } from './api';

const unwrapData = (response) => response?.data !== undefined ? response.data : response;

export const userService = {
  async getUsers(params = {}) {
    const response = await api.get('/users', params);
    const payload = unwrapData(response);
    const users = payload?.users || payload?.items || (Array.isArray(payload) ? payload : payload?.data || []);
    const total = payload?.total ?? payload?.totalCount ?? response?.total ?? users.length;
    const page = payload?.page ?? params.page ?? 1;
    const limit = payload?.limit ?? params.limit ?? 10;
    return { users, total, page, limit, totalPages: payload?.totalPages ?? Math.max(1, Math.ceil(total / limit)) };
  },

  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    return unwrapData(response)?.user || unwrapData(response);
  },

  async createUser(payload) {
    const response = await api.post('/users', {
      name: payload.name.trim(), email: payload.email.trim(), password: payload.password,
      role: payload.role, isActive: Boolean(payload.isActive),
    });
    const data = unwrapData(response);
    return data?.user || data;
  },

  async updateUser(id, payload) {
    const body = {
      name: payload.name.trim(), email: payload.email.trim(), role: payload.role,
      isActive: Boolean(payload.isActive),
    };
    if (payload.password) body.password = payload.password;
    const response = await api.put(`/users/${id}`, body);
    const data = unwrapData(response);
    return data?.user || data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return unwrapData(response);
  },
};