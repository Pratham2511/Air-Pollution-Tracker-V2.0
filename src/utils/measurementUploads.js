import { CITY_CATALOG_BY_ID } from '../data/cityCatalog';

export const REQUIRED_UPLOAD_COLUMNS = ['city_id', 'aqi', 'pollutant', 'timestamp'];

export const ACCEPTED_UPLOAD_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
export const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB ceiling to protect memory
export const MAX_UPLOAD_ROWS = 5000; // guardrail for operational imports

export const ISSUE_LABELS = {
  missing_city: 'Missing city ID',
  unknown_city: 'Unknown city',
  invalid_aqi: 'Invalid AQI',
  missing_pollutant: 'Missing pollutant',
  invalid_timestamp: 'Invalid timestamp',
};

export const sanitizeNumber = (value) => {
  if (typeof value === 'number') {
    return value;
  }
  if (value == null) {
    return Number.NaN;
  }
  const normalized = String(value).trim().replace(/[^0-9.+-]/g, '');
  return Number(normalized);
};

export const isValidAqi = (aqi) => Number.isFinite(aqi) && aqi >= 0 && aqi <= 500;

const looksLikeCsvFilename = (name) => typeof name === 'string' && name.toLowerCase().endsWith('.csv');

const containsUnsupportedControlCharacters = (text) => /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text);

const buildIssuesTally = (rejectedRows) => rejectedRows.reduce((accumulator, row) => {
  row.reasons.forEach((reason) => {
    accumulator[reason] = (accumulator[reason] ?? 0) + 1;
  });
  return accumulator;
}, {});

export const buildSummaryMessage = ({ totalRows, acceptedRows, rejectedRows, issues }) => {
  const base = `Processed ${totalRows} rows. Accepted ${acceptedRows.length}. Rejected ${rejectedRows.length}.`;
  if (!rejectedRows.length) {
    return base;
  }
  const breakdown = Object.entries(issues)
    .map(([issue, count]) => `${ISSUE_LABELS[issue] ?? issue}: ${count}`)
    .join(', ');
  return `${base} Issues — ${breakdown}.`;
};

export const analyzeUploadRecords = (records) => {
  const acceptedRows = [];
  const rejectedRows = [];

  records.forEach((record, index) => {
    if (!record) {
      return;
    }

    const cityId = (record.cityId ?? record.city_id ?? '').trim();
    const aqiValue = sanitizeNumber(record.aqi ?? record.AQI ?? record.value);
    const pollutant = (record.pollutant ?? record.dominant_pollutant ?? record.dominantPollutant ?? '').toUpperCase();
    const timestamp = record.timestamp ?? record.observed_at ?? record.observedAt ?? record.date ?? '';
    const rowNumber = record.rowNumber ?? index + 1;

    const reasons = [];
    if (!cityId) {
      reasons.push('missing_city');
    } else if (!CITY_CATALOG_BY_ID[cityId]) {
      reasons.push('unknown_city');
    }
    if (!isValidAqi(aqiValue)) {
      reasons.push('invalid_aqi');
    }
    if (!pollutant) {
      reasons.push('missing_pollutant');
    }
    if (!timestamp || Number.isNaN(Date.parse(timestamp))) {
      reasons.push('invalid_timestamp');
    }

    if (reasons.length) {
      rejectedRows.push({ rowNumber, cityId, reasons });
    } else {
      acceptedRows.push({ rowNumber, cityId, aqi: aqiValue, pollutant, timestamp });
    }
  });

  const totalRows = records.length;
  const issues = buildIssuesTally(rejectedRows);

  return {
    totalRows,
    acceptedRows,
    rejectedRows,
    issues,
    summary: buildSummaryMessage({ totalRows, acceptedRows, rejectedRows, issues }),
  };
};

export const parseCsvContent = (content, { maxRows = MAX_UPLOAD_ROWS } = {}) => {
  if (!content || !content.trim()) {
    throw new Error('The uploaded CSV is empty.');
  }

  const sanitized = content.replace(/^\uFEFF/, '');

  if (containsUnsupportedControlCharacters(sanitized)) {
    throw new Error('Upload contains unsupported control characters. Provide UTF-8 CSV content.');
  }

  const lines = sanitized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV must include a header and at least one data row.');
  }

  const headerLine = lines.shift();
  const dataRowCount = lines.length;

  if (dataRowCount > maxRows) {
    throw new Error(`Upload limit exceeded. Provide at most ${maxRows} data rows per file.`);
  }

  const headers = headerLine.split(',').map((value) => value.trim().toLowerCase());
  const missingColumns = REQUIRED_UPLOAD_COLUMNS.filter((column) => !headers.includes(column));

  if (missingColumns.length) {
    throw new Error(`Upload CSV missing required columns: ${missingColumns.join(', ')}.`);
  }

  const indices = headers.reduce((accumulator, header, index) => {
    accumulator[header] = index;
    return accumulator;
  }, {});

  const records = lines.map((line, index) => {
    const values = line.split(',').map((value) => value.trim());
    return {
      cityId: values[indices.city_id] ?? '',
      aqi: values[indices.aqi] ?? '',
      pollutant: values[indices.pollutant] ?? '',
      timestamp: values[indices.timestamp] ?? '',
      rowNumber: index + 2,
    };
  });

  return analyzeUploadRecords(records);
};

export const analyzeUploadPayload = async ({ file, records }, {
  maxBytes = MAX_UPLOAD_SIZE_BYTES,
  maxRows = MAX_UPLOAD_ROWS,
  acceptedTypes = ACCEPTED_UPLOAD_TYPES,
} = {}) => {
  if (file && records) {
    throw new Error('Provide either a CSV file or a records array, not both.');
  }

  if (file) {
    if (file.size != null && file.size > maxBytes) {
      throw new Error(`Upload exceeds the maximum allowed size of ${(maxBytes / (1024 * 1024)).toFixed(1)} MB.`);
    }
    if (file.type && !acceptedTypes.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload a CSV file.');
    }
    if (!looksLikeCsvFilename(file.name ?? '')) {
      throw new Error('Unsupported file extension. Please upload a .csv file.');
    }
    if (typeof file.text !== 'function') {
      throw new Error('Unsupported file source.');
    }
    const content = await file.text();
    return parseCsvContent(content, { maxRows });
  }

  if (Array.isArray(records)) {
    if (records.length > maxRows) {
      throw new Error(`Upload limit exceeded. Provide at most ${maxRows} records per submission.`);
    }
    return analyzeUploadRecords(records);
  }

  throw new Error('Measurement upload requires a CSV file or prepared records.');
};

export default {
  REQUIRED_UPLOAD_COLUMNS,
  ISSUE_LABELS,
  sanitizeNumber,
  isValidAqi,
  buildSummaryMessage,
  analyzeUploadRecords,
  parseCsvContent,
  analyzeUploadPayload,
};
