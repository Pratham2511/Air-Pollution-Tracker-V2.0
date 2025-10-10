import { CITY_CATALOG_BY_ID } from '../data/cityCatalog';

export const REQUIRED_UPLOAD_COLUMNS = ['city_id', 'aqi', 'pollutant', 'timestamp'];

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

export const parseCsvContent = (content) => {
  if (!content || !content.trim()) {
    throw new Error('The uploaded CSV is empty.');
  }

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV must include a header and at least one data row.');
  }

  const headerLine = lines.shift();
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

export const analyzeUploadPayload = async ({ file, records }) => {
  if (file && records) {
    throw new Error('Provide either a CSV file or a records array, not both.');
  }

  if (file) {
    if (typeof file.text !== 'function') {
      throw new Error('Unsupported file source.');
    }
    const content = await file.text();
    return parseCsvContent(content);
  }

  if (Array.isArray(records)) {
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
