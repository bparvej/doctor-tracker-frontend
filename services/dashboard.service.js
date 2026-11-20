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

      const docPayload = doctorsRes?.data !== undefined ? doctorsRes.data : doctorsRes;
      const patPayload = patientsRes?.data !== undefined ? patientsRes.data : patientsRes;

      const extractList = (payload, keys) => {
        if (Array.isArray(payload)) return payload;
        for (const key of keys) {
          if (Array.isArray(payload?.[key])) return payload[key];
        }
        return [];
      };

      const doctors = extractList(docPayload, ['doctors', 'items', 'data']);
      const patients = extractList(patPayload, ['patients', 'items', 'data']);

      const totalDoctors = docPayload?.total ?? docPayload?.totalCount ?? doctors.length;
      const totalPatients = patPayload?.total ?? patPayload?.totalCount ?? patients.length;

      // Normalize doctor-patient assignments across common backend schemas.
      const doctorPatientCounts = {};
      doctors.forEach((d) => {
        const id = d._id || d.id;
        if (id) {
          doctorPatientCounts[String(id)] = {
            name: d.name || d.fullName || d.doctorName || 'Unknown Doctor',
            count: Array.isArray(d.patients) ? d.patients.length : 0,
          };
        }
      });

      patients.forEach((p) => {
        const doctorValue = p.doctorId ?? p.doctor ?? p.assignedDoctor;
        const docId = doctorValue?._id || doctorValue?.id || (typeof doctorValue === 'object' ? null : doctorValue);
        if (docId && doctorPatientCounts[String(docId)]) {
          doctorPatientCounts[String(docId)].count += 1;
        }
      });

      const patientsPerDoctor = Object.values(doctorPatientCounts).map((item) => ({
        doctor: item.name,
        patients: Number(item.count) || 0,
      }));

      // Registration trends by date
      const dateMap = {};
      patients.forEach((p) => {
        const d = p.createdAt || p.registeredAt || p.registrationDate || p.date;
        if (d) {
          const parsedDate = new Date(d);
          if (!Number.isNaN(parsedDate.getTime())) {
            const dateKey = parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
          }
        }
      });

      const registrationTrends = Object.entries(dateMap)
        .map(([date, count]) => ({
          date,
          registrations: Number(count) || 0,
          sortDate: new Date(date),
        }))
        .sort((a, b) => a.sortDate - b.sortDate)
        .map(({ date, registrations }) => ({ date, registrations }));

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
