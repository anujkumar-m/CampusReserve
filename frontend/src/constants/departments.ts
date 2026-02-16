/**
 * Official Department Codes and Names for BIT Sathy
 * Used for dropdowns and role assignment
 */

export const DEPARTMENTS = {
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
    BT: 'Biotechnology',
};

// Array of department options for dropdowns
export const DEPARTMENT_LIST = Object.entries(DEPARTMENTS).map(([code, name]) => ({
    code,
    name,
    value: code, // Use code (CS, AD, IT, etc.) as value to match backend
}));

// Get department name from code
export const getDepartmentName = (code: string): string | null => {
    return DEPARTMENTS[code.toUpperCase() as keyof typeof DEPARTMENTS] || null;
};

// Validate department code
export const isValidDepartmentCode = (code: string): boolean => {
    return Object.keys(DEPARTMENTS).includes(code.toUpperCase());
};
