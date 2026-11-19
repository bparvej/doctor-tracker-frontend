import { api } from './api';

export const dashboardService = {
  /**
   * Fetch aggregate dashboard metrics and statistics
   */
  async getDashboardData() {
    try {
      // 1. Attempt dedicated live backend /dashboard/stats endpoint
      try {
        const response = await api.get('/dashboard/stats');
        const stats = response.data !== undefined ? response.data : response;
        if (stats && (stats.totalDoctors !== undefined || stats.stats || stats.overview)) {
          const overview = stats.overview || stats;
          
          // Also fetch recent doctors and patients for the dashboard tables
          const [doctorsRes, patientsRes] = await Promise.all([
            api.get('/doctors', { limit: 5 }).catch(() => ({ data: [] })),
            api.get('/patients', { limit: 5 }).catch(() => ({ data: [] })),
          ]);

          const recentDocs = doctorsRes.data?.items || doctorsRes.data || doctorsRes.doctors || [];
          const recentPats = patientsRes.data?.items || patientsRes.data || patientsRes.patients || [];

          return {
            totalDoctors: overview.totalDoctors ?? overview.doctorsCount ?? 0,
            totalPatients: overview.totalPatients ?? overview.patientsCount ?? 0,
            averagePatientsPerDoctor: overview.averagePatientsPerDoctor ?? overview.avgPatientsPerDoctor ?? (
              overview.totalDoctors > 0 ? (overview.totalPatients / overview.totalDoctors).toFixed(1) : 0
            ),
            recentDoctors: Array.isArray(recentDocs) ? recentDocs.slice(0, 5) : [],
            recentPatients: Array.isArray(recentPats) ? recentPats.slice(0, 5) : [],
            patientsPerDoctor: stats.patientsPerDoctor || overview.patientsPerDoctor || [],
            registrationTrends: stats.registrationTrends || overview.registrationTrends || [],
            specializationDistribution: stats.specializationDistribution || overview.specializationDistribution || [],
          };
        }
      } catch (statsErr) {
        // Fallback to aggregation if needed
      }

      // 2. Parallel requests fallback to build accurate live data from entities
      const [doctorsRes, patientsRes] = await Promise.all([
        api.get('/doctors', { limit: 100 }),
        api.get('/patients', { limit: 100 }),
      ]);

      const docPayload = doctorsRes.data !== undefined ? doctorsRes.data : doctorsRes;
      const patPayload = patientsRes.data !== undefined ? patientsRes.data : patientsRes;

      const doctors = Array.isArray(docPayload) ? docPayload : (docPayload.doctors || docPayload.items || []);
      const patients = Array.isArray(patPayload) ? patPayload : (patPayload.patients || patPayload.items || []);

      const totalDoctors = docPayload.total ?? docPayload.totalCount ?? doctors.length;
      const totalPatients = patPayload.total ?? patPayload.totalCount ?? patients.length;

      // Patients per doctor calculation
      const doctorPatientCounts = {};
      doctors.forEach((d) => {
        const id = d._id || d.id;
        doctorPatientCounts[id] = {
          name: d.name,
          count: 0,
        };
      });

      patients.forEach((p) => {
        const docId = p.doctorId?._id || p.doctorId || p.doctor?._id || p.doctor;
        if (docId && doctorPatientCounts[docId]) {
          doctorPatientCounts[docId].count += 1;
        }
      });

      const patientsPerDoctor = Object.values(doctorPatientCounts).map((item) => ({
        doctor: item.name,
        patients: item.count,
      }));

      // Registration trends by date
      const dateMap = {};
      patients.forEach((p) => {
        const d = p.createdAt || p.registeredAt || p.date;
        if (d) {
          const dateKey = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
        }
      });

      const registrationTrends = Object.entries(dateMap).map(([date, count]) => ({
        date,
        registrations: count,
      }));

      // Specialization distribution
      const specMap = {};
      doctors.forEach((d) => {
        const spec = d.specialization || 'Other';
        specMap[spec] = (specMap[spec] || 0) + 1;
      });
      const specializationDistribution = Object.entries(specMap).map(([specialization, count]) => ({
        specialization,
        count,
      }));

      return {
        totalDoctors,
        totalPatients,
        averagePatientsPerDoctor: totalDoctors > 0 ? (totalPatients / totalDoctors).toFixed(1) : 0,
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
