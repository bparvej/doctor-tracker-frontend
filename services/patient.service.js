import { api } from './api';

export const patientService = {
  /**
   * Get paginated patients with search & filters
   */
  async getPatients(queryParams = {}) {
    try {
      const response = await api.get('/patients', queryParams);
      const payload = response.data !== undefined ? response.data : response;

      if (Array.isArray(payload)) {
        return {
          patients: payload,
          total: response.total ?? response.count ?? payload.length,
          page: queryParams.page || 1,
          limit: queryParams.limit || 10,
          totalPages: Math.ceil(payload.length / (queryParams.limit || 10)),
        };
      }

      const patientsList = payload.patients || payload.items || payload.data || [];
      const totalCount =
        payload.total ??
        payload.totalCount ??
        response.total ??
        response.count ??
        patientsList.length;

      return {
        patients: patientsList,
        total: totalCount,
        page: payload.page || queryParams.page || 1,
        limit: payload.limit || queryParams.limit || 10,
        totalPages: payload.totalPages || Math.ceil(totalCount / (queryParams.limit || 10)) || 1,
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
   * Create new patient - strictly matches Fastify schema
   */
  async createPatient(payload) {
    try {
      const genderUpper = (payload.gender || 'MALE').toUpperCase();
      const validGender = ['MALE', 'FEMALE', 'OTHER'].includes(genderUpper) ? genderUpper : 'OTHER';

      // Backend schema: required [name, age, gender, phone, condition, doctorId], additionalProperties: false
      const cleanPayload = {
        name: payload.name.trim(),
        age: parseInt(payload.age, 10),
        gender: validGender,
        phone: payload.phone ? payload.phone.trim() : 'N/A',
        condition: payload.condition || 'Stable',
        doctorId: payload.doctorId,
      };

      if (payload.email && payload.email.trim()) {
        cleanPayload.email = payload.email.trim();
      }

      const response = await api.post('/patients', cleanPayload);
      return response.data || response.patient || response;
    } catch (error) {
      console.error('[patientService.createPatient] Error:', error);
      throw error;
    }
  },

  /**
   * Update existing patient - strictly matches Fastify schema
   */
  async updatePatient(id, payload) {
    try {
      const cleanPayload = {};
      if (payload.name) cleanPayload.name = payload.name.trim();
      if (payload.age !== undefined && payload.age !== '') cleanPayload.age = parseInt(payload.age, 10);
      if (payload.gender) {
        const genderUpper = payload.gender.toUpperCase();
        cleanPayload.gender = ['MALE', 'FEMALE', 'OTHER'].includes(genderUpper) ? genderUpper : 'OTHER';
      }
      if (payload.phone) cleanPayload.phone = payload.phone.trim();
      if (payload.email && payload.email.trim()) {
        cleanPayload.email = payload.email.trim();
      }
      if (payload.condition) cleanPayload.condition = payload.condition;
      if (payload.doctorId) cleanPayload.doctorId = payload.doctorId;

      const response = await api.put(`/patients/${id}`, cleanPayload);
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
