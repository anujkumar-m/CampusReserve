/**
 * Official Department Codes and Names for BIT Sathy
 * Used for email parsing and role assignment
 */

const DEPARTMENTS = {
    CS: 'Computer Science',
    AL: 'Artificial Intelligence & Machine Learning',
    AD: 'Artificial Intelligence & Data Science',
    IT: 'Information Technology',
    MZ: 'Mechatronics',
    ME: 'Mechanical Engineering',
    EE: 'Electrical Engineering',
    EC: 'Electronics & Communication',
    EI: 'Electronics & Instrumentation',
    CE: 'Civil Engineering',
    FD: 'Fashion Design',
    FT: 'Fashion Technology',
    BT: 'Biotechnology'
};

// Array of valid department codes
const DEPARTMENT_CODES = Object.keys(DEPARTMENTS);

// Get department name from code
const getDepartmentName = (code) => {
    return DEPARTMENTS[code.toUpperCase()] || null;
};

// Validate department code
const isValidDepartmentCode = (code) => {
    return DEPARTMENT_CODES.includes(code.toUpperCase());
};

module.exports = {
    DEPARTMENTS,
    DEPARTMENT_CODES,
    getDepartmentName,
    isValidDepartmentCode
};
