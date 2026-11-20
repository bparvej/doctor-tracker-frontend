import { api } from './api';

export const dashboardService = {
  /**
   * Fetch aggregate dashboard metrics and statistics
   */
  async getDashboardData() {
    try {
      let statsPayload = null;

      try {
        const statsResponse = await api.get('/dashboard/stats');
        statsPayload = statsResponse?.data !== undefined ? statsResponse.data : statsResponse;
      } catch (_statsError) {
        // Entity aggregation below remains available when stats is unavailable.
      }

      let doctorsResponse;
      let patientsResponse;

      try {
        [doctorsResponse, patientsResponse] = await Promise.all([
          api.get('/doctors', { limit: 100 }),
          api.get('/patients', { limit: 100 }),
        ]);
      } catch (error) {
        throw error;
      }

      const doctorPayload = doctorsResponse?.data !== undefined ? doctorsResponse.data : doctorsResponse;
      const patientPayload = patientsResponse?.data !== undefined ? patientsResponse.data : patientsResponse;

      const extractList = (payload, keys) => {
        if (Array.isArray(payload)) return payload;
        for (const key of keys) {
          if (Array.isArray(payload?.[key])) return payload[key];
        }
        return [];
      };

      const doctors = extractList(doctorPayload, ['doctors', 'items', 'data']);
      const patients = extractList(patientPayload, ['patients', 'items', 'data']);

      const doctorPatientCounts = {};
      doctors.forEach((doctor) => {
        const id = doctor._id || doctor.id;
        if (!id) return;
        doctorPatientCounts[String(id)] = {
          doctor: doctor.name || doctor.fullName || doctor.doctorName || 'Unknown Doctor',
          patients: Array.isArray(doctor.patients) ? doctor.patients.length : 0,
        };
      });

      patients.forEach((patient) => {
        const doctorValue = patient.doctorId ?? patient.doctor ?? patient.assignedDoctor;
        const doctorId = doctorValue?._id || doctorValue?.id || (typeof doctorValue === 'object' ? null : doctorValue);
        if (doctorId && doctorPatientCounts[String(doctorId)]) {
          doctorPatientCounts[String(doctorId)].patients += 1;
        }
      });

      const patientsPerDoctor = Object.values(doctorPatientCounts);

      const dateMap = new Map();
      patients.forEach((patient) => {
        const rawDate =
          patient.createdAt || patient.created_at || patient.registeredAt ||
          patient.registrationDate || patient.registration_date || patient.date ||
          patient.timestamp || patient.admissionDate;

        if (!rawDate) return;

        const dateValue = typeof rawDate === 'object' && rawDate.$date
          ? rawDate.$date
          : rawDate;
        const parsedDate = new Date(dateValue);

        if (Number.isNaN(parsedDate.getTime())) return;

        const dateKey = parsedDate.toISOString().slice(0, 10);
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      });

      const registrationTrends = Array.from(dateMap.entries())
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([dateKey, registrations]) => {
          const parsedDate = new Date(`${dateKey}T00:00:00Z`);
          return {
            date: parsedDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: '2-digit',
              timeZone: 'UTC',
            }),
            registrations,
          };
        });

      const statsOverview = statsPayload?.overview || statsPayload?.stats || statsPayload || {};
      const specializationMap = {};
      doctors.forEach((doctor) => {
        const specialization = doctor.specialization || 'Other';
        specializationMap[specialization] = (specializationMap[specialization] || 0) + 1;
      });

      const specializationDistribution = Object.entries(specializationMap).map(([specialization, count]) => ({
        specialization,
        count,
      }));

      const totalDoctors = statsOverview.totalDoctors ?? statsOverview.doctorsCount ?? doctorPayload?.total ?? doctors.length;
      const totalPatients = statsOverview.totalPatients ?? statsOverview.patientsCount ?? patientPayload?.total ?? patients.length;

      return {
        totalDoctors,
        totalPatients,
        averagePatientsPerDoctor: totalDoctors > 0
          ? (totalPatients / totalDoctors).toFixed(1)
          : 0,
        recentDoctors: doctors.slice(0, 5),
        recentPatients: patients.slice(0, 5),
        patientsPerDoctor,
        registrationTrends,
        specializationDistribution,
      };
    } catch (error) {
      console.error('[dashboardService.getDashboardData] Error:', error);
      throw error;
    }
  },
};
