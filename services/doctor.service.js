import { api } from './api';

export const doctorService = {
  /**
   * Get paginated doctors with search & filters
   */
  async getDoctors(queryParams = {}) {
    try {
      const response = await api.get('/doctors', queryParams);
      // Support various response structures: { data, total, page, totalPages } or { doctors, total } or array
      if (Array.isArray(response)) {
        return {
          doctors: response,
          total: response.length,
          page: queryParams.page || 1,
          limit: queryParams.limit || 10,
          totalPages: Math.ceil(response.length / (queryParams.limit || 10)),
        };
      }

      return {
        doctors: response.data || response.doctors || [],
        total: response.total ?? response.count ?? (response.data?.length || 0),
        page: response.page || queryParams.page || 1,
        limit: response.limit || queryParams.limit || 10,
        totalPages: response.totalPages || Math.ceil((response.total || 0) / (queryParams.limit || 10)) || 1,
      };
    } catch (error) {
      console.error('[doctorService.getDoctors] Error:', error);
      throw error;
    }
  },

  /**
   * Get single doctor by ID
   */
  async getDoctorById(id) {
    try {
      const response = await api.get(`/doctors/${id}`);
      return response.data || response.doctor || response;
    } catch (error) {
      console.error(`[doctorService.getDoctorById] Error for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new doctor
   */
  async createDoctor(payload) {
    try {
      const response = await api.post('/doctors', payload);
      return response.data || response.doctor || response;
    } catch (error) {
      console.error('[doctorService.createDoctor] Error:', error);
      throw error;
    }
  },

  /**
   * Update existing doctor
   */
  async updateDoctor(id, payload) {
    try {
      const response = await api.put(`/doctors/${id}`, payload);
      return response.data || response.doctor || response;
    } catch (error) {
      console.error(`[doctorService.updateDoctor] Error for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete doctor
   */
  async deleteDoctor(id) {
    try {
      const response = await api.delete(`/doctors/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`[doctorService.deleteDoctor] Error for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get patients associated with a specific doctor
   */
  async getDoctorPatients(doctorId, queryParams = {}) {
    try {
      // First try dedicated subroute, fallback to filtered patients query
      const response = await api.get(`/doctors/${doctorId}/patients`, queryParams).catch((err) => {
        // If /doctors/:id/patients is not implemented, query /patients?doctorId=:id
        return api.get('/patients', { doctorId, ...queryParams });
      });

      if (Array.isArray(response)) {
        return {
          patients: response,
          total: response.length,
        };
      }

      return {
        patients: response.data || response.patients || [],
        total: response.total ?? response.count ?? (response.data?.length || 0),
        page: response.page || queryParams.page || 1,
        totalPages: response.totalPages || 1,
      };
    } catch (error) {
      console.error(`[doctorService.getDoctorPatients] Error for doctor ${doctorId}:`, error);
      throw error;
    }
  },

  /**
   * Add a new patient under this doctor
   */
  async addPatientToDoctor(doctorId, patientData) {
    try {
      // Try /doctors/:id/patients first, then fallback to /patients with doctorId
      return await api.post(`/doctors/${doctorId}/patients`, patientData).catch(() => {
        return api.post('/patients', { ...patientData, doctorId });
      });
    } catch (error) {
      console.error(`[doctorService.addPatientToDoctor] Error:`, error);
      throw error;
    }
  },

  /**
   * Remove/unlink a patient from a doctor's list
   */
  async removePatientFromDoctor(doctorId, patientId) {
    try {
      return await api.delete(`/doctors/${doctorId}/patients/${patientId}`).catch(() => {
        // Fallback: unlink via PATCH /patients/:id { doctorId: null } or delete patient
        return api.patch(`/patients/${patientId}`, { doctorId: null });
      });
    } catch (error) {
      console.error(`[doctorService.removePatientFromDoctor] Error:`, error);
      throw error;
    }
  },
};

