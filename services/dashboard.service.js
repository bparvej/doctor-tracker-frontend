import { api } from './api';

export const dashboardService = {
  /**
   * Fetch aggregate dashboard metrics and statistics
   */
  async getDashboardData() {
    try {
      // First attempt dedicated /dashboard or /analytics endpoint
      try {
        const response = await api.get('/dashboard');
        if (response && (response.totalDoctors !== undefined || response.stats || response.data)) {
          return response.data || response;
        }
      } catch (dashErr) {
        // Fallback to individual endpoints if /dashboard is not implemented on the backend
      }

      // Parallel requests to build accurate, non-fabricated data
      const [doctorsRes, patientsRes] = await Promise.all([
        api.get('/doctors', { limit: 100 }),
        api.get('/patients', { limit: 100 }),
      ]);

      const doctors = doctorsRes.data || doctorsRes.doctors || (Array.isArray(doctorsRes) ? doctorsRes : []);
      const patients = patientsRes.data || patientsRes.patients || (Array.isArray(patientsRes) ? patientsRes : []);

      const totalDoctors = doctorsRes.total ?? doctorsRes.count ?? doctors.length;
      const totalPatients = patientsRes.total ?? patientsRes.count ?? patients.length;

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

      // Registration trends by month / date
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

