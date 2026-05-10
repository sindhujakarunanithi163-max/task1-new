import fs from 'fs';
import path from 'path';
import { parse, Options } from 'csv-parse/sync';

function readCsv<T extends Record<string, string> = Record<string, string>>(
  relativePath: string,
  options: Options = {}
): T[] {
  const absolutePath = path.resolve(process.cwd(), relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`CSV file not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf8');

  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    comment: '#',
    ...options,
  }) as T[];
}

function readCsvRaw(relativePath: string): string[][] {
  return readCsv(relativePath, { columns: false }) as unknown as string[][];
}

function readCsvFiltered<T extends Record<string, string> = Record<string, string>>(
  relativePath: string,
  column: string,
  value: string
): T[] {
  const rows = readCsv<T>(relativePath);
  return rows.filter(row => row[column] === value);
}

function csvToTestData<T extends Record<string, string> = Record<string, string>>(
  relativePath: string,
  descriptionColumn = 'testCase'
): [string, T][] {
  const rows = readCsv<T>(relativePath);
  return rows.map((row, index): [string, T] => {
    const description = row[descriptionColumn] || `Row ${index + 1}`;
    return [description, row];
  });
}

export { readCsv, readCsvRaw, readCsvFiltered, csvToTestData };
