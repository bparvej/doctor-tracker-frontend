import { api } from './api';

export const doctorService = {
  /**
   * Get paginated doctors with search & filters
   */
  async getDoctors(queryParams = {}) {
    try {
      const response = await api.get('/doctors', queryParams);
      
      // Fastify backend returns { success: true, data: { items, total, ... } } or { data: [...], total }
      const payload = response.data !== undefined ? response.data : response;

      if (Array.isArray(payload)) {
        return {
          doctors: payload,
          total: response.total ?? response.count ?? payload.length,
          page: queryParams.page || 1,
          limit: queryParams.limit || 10,
          totalPages: Math.ceil(payload.length / (queryParams.limit || 10)),
        };
      }

      const doctorsList = payload.doctors || payload.items || payload.data || [];
      const totalCount =
        payload.total ??
        payload.totalCount ??
        response.total ??
        response.count ??
        doctorsList.length;

      return {
        doctors: doctorsList,
        total: totalCount,
        page: payload.page || queryParams.page || 1,
        limit: payload.limit || queryParams.limit || 10,
        totalPages: payload.totalPages || Math.ceil(totalCount / (queryParams.limit || 10)) || 1,
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
   * Create new doctor - strictly matches Fastify schema
   */
  async createDoctor(payload) {
    try {
      // Backend schema: required [name, specialization, hospital, phone, email], additionalProperties: false
      const cleanPayload = {
        name: payload.name.trim(),
        specialization: payload.specialization.trim(),
        hospital: payload.hospital.trim(),
        phone: payload.phone.trim(),
        email: payload.email.trim(),
      };
      const response = await api.post('/doctors', cleanPayload);
      return response.data || response.doctor || response;
    } catch (error) {
      console.error('[doctorService.createDoctor] Error:', error);
      throw error;
    }
  },

  /**
   * Update existing doctor - strictly matches Fastify schema
   */
  async updateDoctor(id, payload) {
    try {
      const cleanPayload = {};
      if (payload.name) cleanPayload.name = payload.name.trim();
      if (payload.specialization) cleanPayload.specialization = payload.specialization.trim();
      if (payload.hospital) cleanPayload.hospital = payload.hospital.trim();
      if (payload.phone) cleanPayload.phone = payload.phone.trim();
      if (payload.email) cleanPayload.email = payload.email.trim();

      const response = await api.put(`/doctors/${id}`, cleanPayload);
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
      const response = await api.get(`/doctors/${doctorId}/patients`, queryParams).catch(() => {
        return api.get('/patients', { doctorId, ...queryParams });
      });

      const payload = response.data !== undefined ? response.data : response;

      if (Array.isArray(payload)) {
        return {
          patients: payload,
          total: payload.length,
        };
      }

      const patientsList = payload.patients || payload.items || payload.data || [];
      return {
        patients: patientsList,
        total: payload.total ?? payload.count ?? patientsList.length,
        page: payload.page || queryParams.page || 1,
        totalPages: payload.totalPages || 1,
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
      // Backend schema for POST /api/doctors/{id}/patients:
      // required: [name, age, gender, phone, condition], gender enum: [MALE, FEMALE, OTHER], additionalProperties: false
      const genderUpper = (patientData.gender || 'MALE').toUpperCase();
      const validGender = ['MALE', 'FEMALE', 'OTHER'].includes(genderUpper) ? genderUpper : 'OTHER';

      const cleanPayload = {
        name: patientData.name.trim(),
        age: parseInt(patientData.age, 10),
        gender: validGender,
        phone: patientData.phone ? patientData.phone.trim() : 'N/A',
        condition: patientData.condition || 'Stable',
      };

      if (patientData.email && patientData.email.trim()) {
        cleanPayload.email = patientData.email.trim();
      }

      return await api.post(`/doctors/${doctorId}/patients`, cleanPayload);
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
        return api.delete(`/patients/${patientId}`);
      });
    } catch (error) {
      console.error(`[doctorService.removePatientFromDoctor] Error:`, error);
      throw error;
    }
  },
};
