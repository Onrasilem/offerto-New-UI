import { useState, useCallback } from 'react';
import * as validators from './validators';

export const useFormValidation = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value) => {
    const fieldRule = initialValues[name];
    if (!fieldRule) return null;

    // Rules format: { rule: 'email' | 'phone' | 'required', etc }
    if (typeof fieldRule === 'object' && fieldRule.rule) {
      const { rule, params } = fieldRule;

      if (rule === 'required' && !value) return 'This field is required';
      if (rule === 'email' && value && !validators.isValidEmail(value)) return 'Invalid email address';
      if (rule === 'phone' && value && !validators.isValidPhone(value)) return 'Invalid phone number';
      if (rule === 'iban' && value && !validators.isValidIBAN(value)) return 'Invalid IBAN';
      if (rule === 'bic' && value && !validators.isValidBIC(value)) return 'Invalid BIC';
      if (rule === 'btw' && value && !validators.isValidBTW(value)) return 'Invalid BTW number';
      if (rule === 'postcode' && value && !validators.isValidPostcode(value)) return 'Invalid postcode';
      if (rule === 'min' && params && String(value).length < params) return `Minimum ${params} characters`;
      if (rule === 'max' && params && String(value).length > params) return `Maximum ${params} characters`;
      if (rule === 'positive' && value && !validators.isPositiveNumber(value)) return 'Must be a positive number';
    }
    return null;
  }, [initialValues]);

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Validate in real-time if field was touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  }, [values, validateField]);

  const validateAll = useCallback(() => {
    const newErrors = {};
    Object.keys(values).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) newErrors[name] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateField]);

  const handleSubmit = useCallback(async () => {
    if (validateAll()) {
      await onSubmit(values);
    }
  }, [values, validateAll, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    setValues,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
};
