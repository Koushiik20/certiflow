const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const sampleDir = path.resolve(__dirname, '../../sample_data');
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

// 1. Valid Candidates (10 students)
const validCandidates = [
  {
    'Candidate Name': 'Aarav Sharma',
    'Phone Number': '9876543210',
    'Email': 'aarav.sharma@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 88.5,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-SOL-101'
  },
  {
    'Candidate Name': 'Pooja Verma',
    'Phone Number': '9876543211',
    'Email': 'pooja.verma@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 92.0,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-SOL-102'
  },
  {
    'Candidate Name': 'Rohan Das',
    'Phone Number': '9876543212',
    'Email': 'rohan.das@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 76.5,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-SOL-103'
  },
  {
    'Candidate Name': 'Ananya Sen',
    'Phone Number': '9876543213',
    'Email': 'ananya.sen@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 81.0,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-SOL-104'
  },
  {
    'Candidate Name': 'Kunal Mehta',
    'Phone Number': '9876543214',
    'Email': 'kunal.mehta@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 69.5,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-SOL-105'
  },
  {
    'Candidate Name': 'Neha Nair',
    'Phone Number': '9876543215',
    'Email': 'neha.nair@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 94.0,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-SOL-106'
  },
  {
    'Candidate Name': 'Vikram Chauhan',
    'Phone Number': '9876543216',
    'Email': 'vikram.c@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 73.0,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-SOL-107'
  },
  {
    'Candidate Name': 'Sneha Patil',
    'Phone Number': '9876543217',
    'Email': 'sneha.patil@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 85.0,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-SOL-108'
  },
  {
    'Candidate Name': 'Aditya Kulkarni',
    'Phone Number': '9876543218',
    'Email': 'aditya.k@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 79.5,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-SOL-109'
  },
  {
    'Candidate Name': 'Divya Pillai',
    'Phone Number': '9876543219',
    'Email': 'divya.p@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 90.5,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-SOL-110'
  }
];

const wbValid = XLSX.utils.book_new();
const wsValid = XLSX.utils.json_to_sheet(validCandidates);
XLSX.utils.book_append_sheet(wbValid, wsValid, 'Candidates');
XLSX.writeFile(wbValid, path.join(sampleDir, 'sample_valid_candidates.xlsx'));
XLSX.writeFile(wbValid, path.join(sampleDir, 'sample_valid_candidates.csv'), { bookType: 'csv' });

// 2. Large Cohort (55 candidates) to trigger Quality Team Review (>50 threshold)
const largeCohort = [];
for (let i = 1; i <= 55; i++) {
  largeCohort.push({
    'Candidate Name': `Candidate LargeCohort ${i}`,
    'Phone Number': `98761${String(1000 + i)}`,
    'Email': `student${i}@largecohort.edu`,
    'Course Name': 'Industrial Electrical Systems & Automation',
    'Course Code': 'ELEC-401',
    'Marks': 65 + (i % 30),
    'Result': 'PASS',
    'Training Start Date': '2025-11-01',
    'Training Completion Date': '2026-01-30',
    'Candidate ID': `CAND-ELEC-${String(i).padStart(3, '0')}`
  });
}

const wbLarge = XLSX.utils.book_new();
const wsLarge = XLSX.utils.json_to_sheet(largeCohort);
XLSX.utils.book_append_sheet(wbLarge, wsLarge, 'Candidates');
XLSX.writeFile(wbLarge, path.join(sampleDir, 'sample_large_cohort_55.xlsx'));

// 3. Invalid Spreadsheet with Deliberate Validation Errors
const invalidCandidates = [
  {
    'Candidate Name': 'Good Student One',
    'Phone Number': '9876543220',
    'Email': 'good.one@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 85.0,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-ERR-001'
  },
  {
    'Candidate Name': 'Invalid Phone Student',
    'Phone Number': '12345', // ERROR: Invalid length
    'Email': 'invalid.phone@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 78.0,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-ERR-002'
  },
  {
    'Candidate Name': 'Negative Marks Student',
    'Phone Number': '9876543221',
    'Email': 'negative.marks@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': -10.0, // ERROR: Negative marks
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-ERR-003'
  },
  {
    'Candidate Name': 'Pass Discrepancy Student',
    'Phone Number': '9876543222',
    'Email': 'discrepancy@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 25.0, // ERROR: Marks below 40 but marked PASS
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-ERR-004'
  },
  {
    'Candidate Name': 'Duplicate Phone Student',
    'Phone Number': '9876543220', // ERROR: Duplicate of row 1 phone
    'Email': 'duplicate@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 80.0,
    'Result': 'PASS',
    'Training Start Date': '2026-01-10',
    'Training Completion Date': '2026-02-15',
    'Candidate ID': 'CAND-ERR-005'
  },
  {
    'Candidate Name': 'Invalid Dates Student',
    'Phone Number': '9876543223',
    'Email': 'invalid.date@example.com',
    'Course Name': 'Certified Solar PV Installer',
    'Course Code': 'SOL-201',
    'Marks': 75.0,
    'Result': 'PASS',
    'Training Start Date': '2026-03-01', // ERROR: Start date is after completion date
    'Training Completion Date': '2026-01-15',
    'Candidate ID': 'CAND-ERR-006'
  }
];

const wbInvalid = XLSX.utils.book_new();
const wsInvalid = XLSX.utils.json_to_sheet(invalidCandidates);
XLSX.utils.book_append_sheet(wbInvalid, wsInvalid, 'Candidates');
XLSX.writeFile(wbInvalid, path.join(sampleDir, 'sample_with_validation_errors.xlsx'));

console.log('Sample Excel and CSV files generated successfully in /sample_data:');
console.log(' - sample_valid_candidates.xlsx (10 valid candidates)');
console.log(' - sample_valid_candidates.csv (CSV format)');
console.log(' - sample_large_cohort_55.xlsx (55 candidates to trigger Quality Review)');
console.log(' - sample_with_validation_errors.xlsx (Errors: invalid phone, negative marks, pass discrepancy, duplicates)');
