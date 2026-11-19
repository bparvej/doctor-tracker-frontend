/**
 * Frontend form validation utilities
 */

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Allows optional +, dashes, parentheses, spaces, 7-15 digits
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15 && /^\+?\d+$/.test(cleaned);
};

export const validateDoctorForm = (formData) => {
  const errors = {};

  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Doctor name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!formData.specialization || !formData.specialization.trim()) {
    errors.specialization = 'Specialization is required';
  }

  if (!formData.hospital || !formData.hospital.trim()) {
    errors.hospital = 'Hospital or clinic is required';
  }

  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.phone || !formData.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!isValidPhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number (e.g. 555-019-2834)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validatePatientForm = (formData) => {
  const errors = {};

  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Patient name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (formData.age === undefined || formData.age === null || formData.age === '') {
    errors.age = 'Age is required';
  } else {
    const ageNum = Number(formData.age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
      errors.age = 'Please enter a valid age between 0 and 130';
    }
  }

  if (!formData.gender) {
    errors.gender = 'Gender is required';
  }

  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (formData.email && !isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

