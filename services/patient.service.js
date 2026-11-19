import { api } from './api';

export const patientService = {
  /**
   * Get paginated patients with search & filters
   */
  async getPatients(queryParams = {}) {
    try {
      const response = await api.get('/patients', queryParams);
      if (Array.isArray(response)) {
        return {
          patients: response,
          total: response.length,
          page: queryParams.page || 1,
          limit: queryParams.limit || 10,
          totalPages: Math.ceil(response.length / (queryParams.limit || 10)),
        };
      }

      return {
        patients: response.data || response.patients || [],
        total: response.total ?? response.count ?? (response.data?.length || 0),
        page: response.page || queryParams.page || 1,
        limit: response.limit || queryParams.limit || 10,
        totalPages: response.totalPages || Math.ceil((response.total || 0) / (queryParams.limit || 10)) || 1,
      };
    } catch (error) {
      console.error('[patientService.getPatients] Error:', error);
      throw error;
    }
  },

  /**
   * Get single patient by ID
   */
  async getPatientById(id) {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data || response.patient || response;
    } catch (error) {
      console.error(`[patientService.getPatientById] Error for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new patient
   */
  async createPatient(payload) {
    try {
      const response = await api.post('/patients', payload);
      return response.data || response.patient || response;
    } catch (error) {
      console.error('[patientService.createPatient] Error:', error);
      throw error;
    }
  },

  /**
   * Update existing patient
   */
  async updatePatient(id, payload) {
    try {
      const response = await api.put(`/patients/${id}`, payload);
      return response.data || response.patient || response;
    } catch (error) {
      console.error(`[patientService.updatePatient] Error for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete patient
   */
  async deletePatient(id) {
    try {
      const response = await api.delete(`/patients/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`[patientService.deletePatient] Error for ${id}:`, error);
      throw error;
    }
  },
};

