import { api } from './api';

export const auditService = {
  /**
   * Fetch paginated audit logs with search & filters
   */
  async getAuditLogs(queryParams = {}) {
    try {
      const response = await api.get('/audit-logs', queryParams).catch((err) => {
        // Also support alternate naming /audits or /logs
        return api.get('/audits', queryParams);
      });

      if (Array.isArray(response)) {
        return {
          logs: response,
          total: response.length,
          page: queryParams.page || 1,
          limit: queryParams.limit || 10,
          totalPages: Math.ceil(response.length / (queryParams.limit || 10)),
        };
      }

      return {
        logs: response.data || response.logs || response.audits || [],
        total: response.total ?? response.count ?? (response.data?.length || 0),
        page: response.page || queryParams.page || 1,
        limit: response.limit || queryParams.limit || 10,
        totalPages: response.totalPages || Math.ceil((response.total || 0) / (queryParams.limit || 10)) || 1,
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
      const response = await api.get(`/audit-logs/${id}`).catch(() => {
        return api.get(`/audits/${id}`);
      });
      return response.data || response.log || response;
    } catch (error) {
      console.error(`[auditService.getAuditLogById] Error for ${id}:`, error);
      throw error;
    }
  },
};

