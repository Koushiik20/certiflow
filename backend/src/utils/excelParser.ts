import * as XLSX from 'xlsx';

export interface CandidateRowInput {
  rowNumber: number;
  candidateName: string;
  phoneNumber: string;
  email?: string;
  courseName: string;
  courseCode: string;
  marks: number;
  result: 'PASS' | 'FAIL';
  startDate: Date;
  completionDate: Date;
  candidateIdentifier?: string;
}

export interface ValidationError {
  rowNumber: number;
  column?: string;
  field?: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
}

export interface SpreadsheetValidationResult {
  isValid: boolean;
  totalRows: number;
  validRowsCount: number;
  errorCount: number;
  errors: ValidationError[];
  candidates: CandidateRowInput[];
}

// Flexible header normalizer (handles lowercase, spaces, underscores, etc.)
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const REQUIRED_HEADERS_MAP: { [canonical: string]: string[] } = {
  candidateName: ['candidatename', 'name', 'studentname', 'fullname'],
  phoneNumber: ['phonenumber', 'phone', 'mobile', 'mobilenumber', 'contact'],
  courseName: ['coursename', 'course'],
  courseCode: ['coursecode', 'code'],
  marks: ['marks', 'score', 'percentage'],
  result: ['result', 'status', 'passfail'],
  startDate: ['trainingstartdate', 'startdate', 'fromdate'],
  completionDate: ['trainingcompletiondate', 'completiondate', 'enddate', 'todate'],
};

export function parseAndValidateSpreadsheet(
  buffer: Buffer,
  batchCourseCode?: string
): SpreadsheetValidationResult {
  const errors: ValidationError[] = [];
  const candidates: CandidateRowInput[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch (err: any) {
    return {
      isValid: false,
      totalRows: 0,
      validRowsCount: 0,
      errorCount: 1,
      errors: [{ rowNumber: 0, message: 'Invalid or corrupted spreadsheet file format. Could not parse.', severity: 'CRITICAL' }],
      candidates: []
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      isValid: false,
      totalRows: 0,
      validRowsCount: 0,
      errorCount: 1,
      errors: [{ rowNumber: 0, message: 'The workbook contains no sheets.', severity: 'CRITICAL' }],
      candidates: []
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rawData.length < 2) {
    return {
      isValid: false,
      totalRows: 0,
      validRowsCount: 0,
      errorCount: 1,
      errors: [{ rowNumber: 1, message: 'The spreadsheet contains no data rows or missing header row.', severity: 'CRITICAL' }],
      candidates: []
    };
  }

  const headers = rawData[0].map((h) => normalizeHeader(String(h)));
  const headerColMap: { [canonical: string]: number } = {};

  for (const [canonical, aliases] of Object.entries(REQUIRED_HEADERS_MAP)) {
    const colIdx = headers.findIndex((h) => aliases.includes(h));
    if (colIdx === -1) {
      errors.push({
        rowNumber: 1,
        column: canonical,
        message: `Missing mandatory column header matching '${canonical}' (expected one of: ${aliases.join(', ')})`,
        severity: 'CRITICAL'
      });
    } else {
      headerColMap[canonical] = colIdx;
    }
  }

  // Optional headers
  const emailColIdx = headers.findIndex((h) => ['email', 'candidateemail', 'mail'].includes(h));
  const idColIdx = headers.findIndex((h) => ['candidateid', 'candidateidentifier', 'rollnumber', 'enrollmentno'].includes(h));

  if (errors.length > 0) {
    return {
      isValid: false,
      totalRows: rawData.length - 1,
      validRowsCount: 0,
      errorCount: errors.length,
      errors,
      candidates: []
    };
  }

  const seenPhones = new Set<string>();
  const seenCandidateIds = new Set<string>();

  for (let r = 1; r < rawData.length; r++) {
    const row = rawData[r];
    const rowNumber = r + 1;

    // Skip entirely empty rows
    const isRowEmpty = row.every((c) => c === undefined || c === null || String(c).trim() === '');
    if (isRowEmpty) continue;

    const rawName = String(row[headerColMap.candidateName] || '').trim();
    const rawPhone = String(row[headerColMap.phoneNumber] || '').trim();
    const rawCourseName = String(row[headerColMap.courseName] || '').trim();
    const rawCourseCode = String(row[headerColMap.courseCode] || '').trim();
    const rawMarks = row[headerColMap.marks];
    const rawResult = String(row[headerColMap.result] || '').trim().toUpperCase();
    const rawStartDate = row[headerColMap.startDate];
    const rawCompletionDate = row[headerColMap.completionDate];
    const rawEmail = emailColIdx !== -1 ? String(row[emailColIdx] || '').trim() : undefined;
    const rawId = idColIdx !== -1 ? String(row[idColIdx] || '').trim() : undefined;

    // 1. Candidate Name Validation
    if (!rawName || rawName.length < 2) {
      errors.push({
        rowNumber,
        column: 'Candidate Name',
        field: 'candidateName',
        message: 'Candidate name is required and must be at least 2 characters.',
        severity: 'CRITICAL'
      });
    }

    // 2. Phone Number Validation (Standard 10-digit or E.164 without prefix)
    const cleanedPhone = rawPhone.replace(/[^0-9]/g, '');
    const standardPhone = cleanedPhone.length === 12 && cleanedPhone.startsWith('91')
      ? cleanedPhone.slice(2)
      : cleanedPhone;

    if (!/^[6-9]\d{9}$/.test(standardPhone)) {
      errors.push({
        rowNumber,
        column: 'Phone Number',
        field: 'phoneNumber',
        message: `Invalid mobile number '${rawPhone}'. Must be a valid 10-digit Indian mobile number starting with 6-9.`,
        severity: 'CRITICAL'
      });
    } else {
      if (seenPhones.has(standardPhone)) {
        errors.push({
          rowNumber,
          column: 'Phone Number',
          field: 'phoneNumber',
          message: `Duplicate phone number '${standardPhone}' found within this upload.`,
          severity: 'CRITICAL'
        });
      }
      seenPhones.add(standardPhone);
    }

    // 3. Email validation (if provided)
    if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      errors.push({
        rowNumber,
        column: 'Email',
        field: 'email',
        message: `Invalid email address format: '${rawEmail}'.`,
        severity: 'CRITICAL'
      });
    }

    // 4. Course Code Match Validation
    if (batchCourseCode && rawCourseCode && rawCourseCode.toUpperCase() !== batchCourseCode.toUpperCase()) {
      errors.push({
        rowNumber,
        column: 'Course Code',
        field: 'courseCode',
        message: `Course code '${rawCourseCode}' does not match batch course code '${batchCourseCode}'.`,
        severity: 'CRITICAL'
      });
    }

    // 5. Marks Validation
    const numericMarks = parseFloat(String(rawMarks));
    if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > 100) {
      errors.push({
        rowNumber,
        column: 'Marks',
        field: 'marks',
        message: `Marks must be a valid numeric score between 0 and 100. Received: '${rawMarks}'.`,
        severity: 'CRITICAL'
      });
    }

    // 6. Result Validation
    if (!['PASS', 'FAIL'].includes(rawResult)) {
      errors.push({
        rowNumber,
        column: 'Result',
        field: 'result',
        message: `Result must be either 'PASS' or 'FAIL'. Received: '${rawResult}'.`,
        severity: 'CRITICAL'
      });
    } else if (rawResult === 'PASS' && numericMarks < 40) {
      errors.push({
        rowNumber,
        column: 'Result & Marks',
        field: 'result',
        message: `Discrepancy: Candidate marked as 'PASS' with marks ${numericMarks} which is below passing threshold (40).`,
        severity: 'CRITICAL'
      });
    }

    // 7. Date Validation
    const startDateObj = rawStartDate instanceof Date ? rawStartDate : new Date(rawStartDate);
    const completionDateObj = rawCompletionDate instanceof Date ? rawCompletionDate : new Date(rawCompletionDate);

    if (isNaN(startDateObj.getTime())) {
      errors.push({
        rowNumber,
        column: 'Start Date',
        field: 'startDate',
        message: `Invalid training start date: '${rawStartDate}'.`,
        severity: 'CRITICAL'
      });
    }
    if (isNaN(completionDateObj.getTime())) {
      errors.push({
        rowNumber,
        column: 'Completion Date',
        field: 'completionDate',
        message: `Invalid training completion date: '${rawCompletionDate}'.`,
        severity: 'CRITICAL'
      });
    }
    if (!isNaN(startDateObj.getTime()) && !isNaN(completionDateObj.getTime()) && startDateObj > completionDateObj) {
      errors.push({
        rowNumber,
        column: 'Dates Range',
        field: 'dates',
        message: `Training start date (${startDateObj.toISOString().split('T')[0]}) cannot be after completion date (${completionDateObj.toISOString().split('T')[0]}).`,
        severity: 'CRITICAL'
      });
    }

    // 8. Candidate Identifier
    const candidateIdentifier = rawId || `CAND-${standardPhone || Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (rawId && seenCandidateIds.has(rawId)) {
      errors.push({
        rowNumber,
        column: 'Candidate ID',
        field: 'candidateIdentifier',
        message: `Duplicate Candidate Identifier '${rawId}' in spreadsheet.`,
        severity: 'CRITICAL'
      });
    }
    seenCandidateIds.add(candidateIdentifier);

    if (errors.filter((e) => e.rowNumber === rowNumber).length === 0) {
      candidates.push({
        rowNumber,
        candidateName: rawName,
        phoneNumber: standardPhone,
        email: rawEmail,
        courseName: rawCourseName,
        courseCode: rawCourseCode,
        marks: numericMarks,
        result: rawResult as 'PASS' | 'FAIL',
        startDate: startDateObj,
        completionDate: completionDateObj,
        candidateIdentifier,
      });
    }
  }

  const isValid = errors.filter((e) => e.severity === 'CRITICAL').length === 0;

  return {
    isValid,
    totalRows: rawData.length - 1,
    validRowsCount: isValid ? candidates.length : 0,
    errorCount: errors.length,
    errors,
    candidates: isValid ? candidates : [],
  };
}

export function generateSampleExcelBuffer(): Buffer {
  const data = [
    {
      'Candidate Name': 'Aarav Sharma',
      'Phone Number': '9876543210',
      'Email': 'aarav.sharma@example.com',
      'Course Name': 'Certified Solar PV Installer',
      'Course Code': 'SOL-201',
      'Marks': 84.5,
      'Result': 'PASS',
      'Training Start Date': '2026-01-10',
      'Training Completion Date': '2026-02-15',
      'Candidate ID': 'CAND-SOL-001'
    },
    {
      'Candidate Name': 'Pooja Verma',
      'Phone Number': '9876543211',
      'Email': 'pooja.verma@example.com',
      'Course Name': 'Certified Solar PV Installer',
      'Course Code': 'SOL-201',
      'Marks': 91.0,
      'Result': 'PASS',
      'Training Start Date': '2026-01-10',
      'Training Completion Date': '2026-02-15',
      'Candidate ID': 'CAND-SOL-002'
    },
    {
      'Candidate Name': 'Rohan Das',
      'Phone Number': '9876543212',
      'Email': 'rohan.das@example.com',
      'Course Name': 'Certified Solar PV Installer',
      'Course Code': 'SOL-201',
      'Marks': 72.0,
      'Result': 'PASS',
      'Training Start Date': '2026-01-10',
      'Training Completion Date': '2026-02-15',
      'Candidate ID': 'CAND-SOL-003'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

