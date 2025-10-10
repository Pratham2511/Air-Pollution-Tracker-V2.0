import {
  analyzeUploadPayload,
  analyzeUploadRecords,
  buildSummaryMessage,
  parseCsvContent,
  REQUIRED_UPLOAD_COLUMNS,
} from '../measurementUploads';

const buildCsv = (rows) => {
  const header = REQUIRED_UPLOAD_COLUMNS.join(',');
  const body = rows.map((row) => REQUIRED_UPLOAD_COLUMNS.map((column) => row[column] ?? '').join(','));
  return [header, ...body].join('\n');
};

describe('measurement upload utilities', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  it('parses valid CSV content and accepts known cities', () => {
    const csv = buildCsv([
      {
        city_id: 'delhi',
        aqi: '175',
        pollutant: 'pm2.5',
        timestamp: '2025-10-10T10:00:00Z',
      },
      {
        city_id: 'mumbai',
        aqi: '140',
        pollutant: 'pm10',
        timestamp: '2025-10-10T11:00:00Z',
      },
    ]);

    const result = parseCsvContent(csv);

    expect(result.totalRows).toBe(2);
    expect(result.acceptedRows).toHaveLength(2);
    expect(result.rejectedRows).toHaveLength(0);
    expect(result.summary).toMatch(/Processed 2 rows/);
  });

  it('marks rows with unknown cities or invalid AQI as rejected', () => {
    const analysis = analyzeUploadRecords([
      {
        cityId: 'unknown-city',
        aqi: '401',
        pollutant: 'O3',
        timestamp: '2025-10-10T10:00:00Z',
      },
      {
        cityId: 'delhi',
        aqi: 'bad-data',
        pollutant: 'NO2',
        timestamp: 'invalid-date',
      },
    ]);

    expect(analysis.acceptedRows).toHaveLength(0);
    expect(analysis.rejectedRows).toHaveLength(2);
    expect(analysis.issues.unknown_city).toBeGreaterThanOrEqual(1);
    expect(analysis.issues.invalid_aqi).toBeGreaterThanOrEqual(1);
    expect(analysis.summary).toContain('Issues');
  });

  it('creates descriptive summary messages', () => {
    const summary = buildSummaryMessage({
      totalRows: 3,
      acceptedRows: [{}, {}],
      rejectedRows: [{ reasons: ['invalid_aqi'] }],
      issues: { invalid_aqi: 1 },
    });

    expect(summary).toContain('Processed 3 rows');
  expect(summary).toContain('Invalid AQI');
  });

  it('analyzes file payloads via text() method', async () => {
    const file = {
      text: jest.fn().mockResolvedValue(
        buildCsv([
          {
            city_id: 'delhi',
            aqi: '200',
            pollutant: 'pm2.5',
            timestamp: '2025-10-10T09:00:00Z',
          },
        ]),
      ),
    };

    const result = await analyzeUploadPayload({ file });

    expect(file.text).toHaveBeenCalledTimes(1);
    expect(result.acceptedRows).toHaveLength(1);
    expect(result.rejectedRows).toHaveLength(0);
  });

  it('throws when both file and records are provided', async () => {
    await expect(async () => {
      await analyzeUploadPayload({
        file: { text: jest.fn().mockResolvedValue('') },
        records: [],
      });
    }).rejects.toThrow('Provide either a CSV file or a records array');
  });

  it('throws when CSV is missing required columns', () => {
    const badCsv = ['city_id,aqi,timestamp', 'delhi,120,2025-10-10T10:00:00Z'].join('\n');
    expect(() => parseCsvContent(badCsv)).toThrow('Upload CSV missing required columns');
  });
});
