const { isValidDepartmentCode } = require('../constants/departments');

/**
 * Email Parser Utility
 * Parses @bitsathy.ac.in emails to extract role, department, and year
 */

const ALLOWED_DOMAIN = '@bitsathy.ac.in';

// Known club email prefixes
const CLUB_EMAILS = ['nss', 'ncc', 'rotaract'];

/**
 * Validate if email is from allowed domain
 * @param {string} email 
 * @returns {boolean}
 */
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
};

/**
 * Parse email and extract user information
 * @param {string} email 
 * @returns {Object} { role, department, year, isValid, error }
 */
const parseEmail = (email) => {
    // Validate domain
    if (!isValidEmail(email)) {
        return {
            isValid: false,
            error: 'Only @bitsathy.ac.in email addresses are allowed'
        };
    }

    const emailLower = email.toLowerCase();
    const localPart = emailLower.split('@')[0]; // Part before @

    // 1. Check for ADMIN
    if (localPart === 'admin') {
        return {
            isValid: true,
            role: 'admin',
            department: null,
            year: null
        };
    }

    // 2. Check for CLUB: nss, ncc, rotaract
    if (CLUB_EMAILS.includes(localPart)) {
        return {
            isValid: true,
            role: 'club',
            clubName: localPart.toUpperCase(),
            department: null,
            year: null
        };
    }

    // 3. Check for HOD pattern: hod<dept>@bitsathy.ac.in
    // Example: hodcs@bitsathy.ac.in
    if (localPart.startsWith('hod')) {
        const deptCode = localPart.substring(3).toUpperCase();

        if (!isValidDepartmentCode(deptCode)) {
            return {
                isValid: false,
                error: `Invalid department code in HOD email: ${deptCode}`
            };
        }

        return {
            isValid: true,
            role: 'department', // System role for HOD is 'department'
            department: deptCode,
            year: null
        };
    }

    // 4. Check for STUDENT pattern: <name>.<dept><year>@bitsathy.ac.in
    // Example: anuj.cs23@bitsathy.ac.in
    const studentPattern = /^([a-z]+)\.([a-z]{2})(\d{2})$/i;
    const studentMatch = localPart.match(studentPattern);

    if (studentMatch) {
        const name = studentMatch[1];
        const deptCode = studentMatch[2].toUpperCase();
        const year = studentMatch[3];

        if (isValidDepartmentCode(deptCode)) {
            return {
                isValid: true,
                role: 'student',
                department: deptCode,
                year: `20${year}`,
                extractedName: name.charAt(0).toUpperCase() + name.slice(1)
            };
        }
    }

    // 5. Check for FACULTY pattern: <name>@bitsathy.ac.in
    // Example: anuj@bitsathy.ac.in (simple pattern, no digits or dots)
    // Note: We assume any other simple name pattern is faculty
    const facultyPattern = /^[a-z]+$/i;
    if (facultyPattern.test(localPart)) {
        return {
            isValid: true,
            role: 'faculty',
            department: null, // Will be selected on first login
            year: null
        };
    }

    // If no pattern matches
    return {
        isValid: false,
        error: 'Email format does not match any recognized pattern (Student, Faculty, HOD, or Club)'
    };
};

/**
 * Extract name from email
 * @param {string} email 
 * @returns {string}
 */
const extractNameFromEmail = (email) => {
    const localPart = email.split('@')[0];

    // For students, extract name before the dot
    if (localPart.includes('.')) {
        const name = localPart.split('.')[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    // For others, capitalize first letter
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
};

module.exports = {
    isValidEmail,
    parseEmail,
    extractNameFromEmail,
    ALLOWED_DOMAIN
};
