import React, { useState } from "react";
import { submitVaccineRecord } from "../services/api";

// Initial empty form state
const initialForm = {
  name: "",
  contactNumber: "",
  passportNo: "",
  cnic: "",
  sdwOf: "",
  travellingCountry: "",
  batchNo: "",
  expiryDate: "",
  vaccineName: "",
  vaccineDate: "",
};

const VaccineForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Frontend validation
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.contactNumber.trim())
      newErrors.contactNumber = "Contact number is required";
    else if (!/^[0-9\-\+\s]{7,15}$/.test(formData.contactNumber))
      newErrors.contactNumber = "Enter a valid contact number";

    if (!formData.passportNo.trim())
      newErrors.passportNo = "Passport No is required";
    if (!formData.cnic.trim()) newErrors.cnic = "CNIC is required";
    else if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic))
      newErrors.cnic = "CNIC format: 12345-1234567-1";

    if (!formData.sdwOf.trim()) newErrors.sdwOf = "S/D/W of is required";
    if (!formData.travellingCountry.trim())
      newErrors.travellingCountry = "Travelling country is required";
    if (!formData.batchNo.trim()) newErrors.batchNo = "Batch No is required";
    if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required";
    if (!formData.vaccineName.trim())
      newErrors.vaccineName = "Vaccine name is required";
    if (!formData.vaccineDate)
      newErrors.vaccineDate = "Vaccine date is required";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await submitVaccineRecord(formData);
      // Reset form on success
      setFormData(initialForm);
      setErrors({});
      // Pass result up to Dashboard
      onSuccess(data.record);
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Submission failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="vaccine-form" noValidate>
      {/* Personal Information Section */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-icon">👤</span> Personal Information
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className={errors.name ? "input-error" : ""}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Contact Number *</label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="e.g. 0300-1234567"
              className={errors.contactNumber ? "input-error" : ""}
            />
            {errors.contactNumber && (
              <span className="field-error">{errors.contactNumber}</span>
            )}
          </div>

          <div className="form-group">
            <label>Passport No *</label>
            <input
              type="text"
              name="passportNo"
              value={formData.passportNo}
              onChange={handleChange}
              placeholder="e.g. AB1234567"
              className={errors.passportNo ? "input-error" : ""}
            />
            {errors.passportNo && (
              <span className="field-error">{errors.passportNo}</span>
            )}
          </div>

          <div className="form-group">
            <label>CNIC *</label>
            <input
              type="text"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              placeholder="12345-1234567-1"
              className={errors.cnic ? "input-error" : ""}
            />
            {errors.cnic && <span className="field-error">{errors.cnic}</span>}
          </div>

          <div className="form-group">
            <label>S/D/W of *</label>
            <input
              type="text"
              name="sdwOf"
              value={formData.sdwOf}
              onChange={handleChange}
              placeholder="Son/Daughter/Wife of"
              className={errors.sdwOf ? "input-error" : ""}
            />
            {errors.sdwOf && (
              <span className="field-error">{errors.sdwOf}</span>
            )}
          </div>

          <div className="form-group">
            <label>Travelling Country *</label>
            <input
              type="text"
              name="travellingCountry"
              value={formData.travellingCountry}
              onChange={handleChange}
              placeholder="e.g. Saudi Arabia"
              className={errors.travellingCountry ? "input-error" : ""}
            />
            {errors.travellingCountry && (
              <span className="field-error">{errors.travellingCountry}</span>
            )}
          </div>
        </div>
      </div>

      {/* Vaccine Details Section */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-icon">💉</span> Vaccine Details
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Vaccine Name *</label>
            <select
              name="vaccineName"
              value={formData.vaccineName}
              onChange={handleChange}
              className={errors.vaccineName ? "input-error" : ""}
            >
              <option value="">Select vaccine</option>
              <option value="Typhoid">Typhoid</option>
              <option value="Meningitis">Meningitis (ACYW135)</option>
              <option value="Hepatitis A">Hepatitis A</option>
              <option value="Hepatitis B">Hepatitis B</option>
              <option value="Yellow Fever">Yellow Fever</option>
              <option value="COVID-19">COVID-19</option>
              <option value="Polio">Polio</option>
              <option value="Influenza">Influenza</option>
              <option value="Other">Other</option>
            </select>
            {errors.vaccineName && (
              <span className="field-error">{errors.vaccineName}</span>
            )}
          </div>

          <div className="form-group">
            <label>Batch No *</label>
            <input
              type="text"
              name="batchNo"
              value={formData.batchNo}
              onChange={handleChange}
              placeholder="e.g. BN-2024-001"
              className={errors.batchNo ? "input-error" : ""}
            />
            {errors.batchNo && (
              <span className="field-error">{errors.batchNo}</span>
            )}
          </div>

          <div className="form-group">
            <label>Vaccine Date *</label>
            <input
              type="date"
              name="vaccineDate"
              value={formData.vaccineDate}
              onChange={handleChange}
              className={errors.vaccineDate ? "input-error" : ""}
            />
            {errors.vaccineDate && (
              <span className="field-error">{errors.vaccineDate}</span>
            )}
          </div>

          <div className="form-group">
            <label>Expiry Date *</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className={errors.expiryDate ? "input-error" : ""}
            />
            {errors.expiryDate && (
              <span className="field-error">{errors.expiryDate}</span>
            )}
          </div>
        </div>
      </div>

      {serverError && <div className="error-message">{serverError}</div>}

      <div className="form-actions">
        <button
          type="submit"
          className="btn-primary btn-large"
          disabled={loading}
        >
          {loading ? "⏳ Generating Card..." : "✅ Generate Vaccination Card"}
        </button>
      </div>
    </form>
  );
};

export default VaccineForm;
