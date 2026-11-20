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
        const statsPayload = response?.data !== undefined ? response.data : response;
        const stats = statsPayload?.stats || statsPayload?.overview ? { ...(statsPayload.stats || statsPayload.overview), ...(statsPayload?.data || {}), ...(statsPayload?.charts || {}) } : statsPayload;

        if (stats && (statsPayload.totalDoctors !== undefined || statsPayload.stats || statsPayload.overview || stats.totalDoctors !== undefined || stats.doctorsCount !== undefined)) {
          const overview = statsPayload.overview || statsPayload.stats || statsPayload || stats;

          const [doctorsRes, patientsRes] = await Promise.all([
            api.get('/doctors', { limit: 100 }).catch(() => ({ data: [] })),
            api.get('/patients', { limit: 100 }).catch(() => ({ data: [] })),
          ]);

          const doctorsPayload = doctorsRes?.data !== undefined ? doctorsRes.data : doctorsRes;
          const patientsPayload = patientsRes?.data !== undefined ? patientsRes.data : patientsRes;
          const recentDocs = Array.isArray(doctorsPayload) ? doctorsPayload : (doctorsPayload?.items || doctorsPayload?.doctors || doctorsPayload?.data || []);
          const recentPats = Array.isArray(patientsPayload) ? patientsPayload : (patientsPayload?.items || patientsPayload?.patients || patientsPayload?.data || []);

          const rawPatientsPerDoctor =
            statsPayload.patientsPerDoctor || statsPayload.patientsByDoctor || statsPayload.charts?.patientsPerDoctor ||
            statsPayload.data?.patientsPerDoctor || statsPayload.data?.patientsByDoctor ||
            stats.patientsPerDoctor || stats.patientsByDoctor || [];

          const rawRegistrationTrends =
            statsPayload.registrationTrends || statsPayload.patientTrends || statsPayload.charts?.registrationTrends ||
            statsPayload.data?.registrationTrends || statsPayload.data?.patientTrends ||
            stats.registrationTrends || stats.patientTrends || [];

          const patientsPerDoctor = (Array.isArray(rawPatientsPerDoctor) ? rawPatientsPerDoctor : [])
            .map((item) => ({
              doctor: item.doctor || item.name || item.doctorName || item.fullName || 'Unknown Doctor',
              patients: Number(item.patients ?? item.count ?? item.patientCount ?? 0),
            }))
            .filter((item) => item.doctor && Number.isFinite(item.patients));

          const registrationTrends = (Array.isArray(rawRegistrationTrends) ? rawRegistrationTrends : [])
            .map((item) => {
              const date = item.date || item.label || item._id || item.createdAt || item.registrationDate;
              const parsedDate = date ? new Date(date) : null;
              return {
                date: parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : String(date || ''),
                registrations: Number(item.registrations ?? item.count ?? item.patients ?? item.total ?? 0),
                sortDate: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date(0),
              };
            })
            .filter((item) => item.date && Number.isFinite(item.registrations))
            .sort((a, b) => a.sortDate - b.sortDate)
            .map(({ date, registrations }) => ({ date, registrations }));

          return {
            totalDoctors: overview.totalDoctors ?? overview.doctorsCount ?? 0,
            totalPatients: overview.totalPatients ?? overview.patientsCount ?? 0,
            averagePatientsPerDoctor: overview.averagePatientsPerDoctor ?? overview.avgPatientsPerDoctor ?? (
              overview.totalDoctors > 0 ? (overview.totalPatients / overview.totalDoctors).toFixed(1) : 0
            ),
            recentDoctors: Array.isArray(recentDocs) ? recentDocs.slice(0, 5) : [],
            recentPatients: Array.isArray(recentPats) ? recentPats.slice(0, 5) : [],
            patientsPerDoctor,
            registrationTrends,
            specializationDistribution: stats.specializationDistribution || statsPayload.specializationDistribution || overview.specializationDistribution || [],
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
