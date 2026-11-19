import { api } from './api';

export const auditService = {
  /**
   * Fetch paginated audit logs with search & filters
   */
  async getAuditLogs(queryParams = {}) {
    try {
      const response = await api.get('/audit-logs', queryParams);
      const payload = response.data !== undefined ? response.data : response;

      if (Array.isArray(payload)) {
        return {
          logs: payload,
          total: response.total ?? response.count ?? payload.length,
          page: queryParams.page || 1,
          limit: queryParams.limit || 10,
          totalPages: Math.ceil(payload.length / (queryParams.limit || 10)),
        };
      }

      const logsList = payload.logs || payload.items || payload.audits || payload.data || [];
      const totalCount =
        payload.total ??
        payload.totalCount ??
        response.total ??
        response.count ??
        logsList.length;

      return {
        logs: logsList,
        total: totalCount,
        page: payload.page || queryParams.page || 1,
        limit: payload.limit || queryParams.limit || 10,
        totalPages: payload.totalPages || Math.ceil(totalCount / (queryParams.limit || 10)) || 1,
      };
    } catch (error) {
      console.error('[auditService.getAuditLogs] Error:', error);
      throw error;
    }
  },

  /**
   * Fetch a single audit log record by ID
   */
  async getAuditLogById(id) {
    try {
      const response = await api.get(`/audit-logs/${id}`);
      return response.data || response.log || response;
    } catch (error) {
      console.error(`[auditService.getAuditLogById] Error for ${id}:`, error);
      throw error;
    }
  },
};
