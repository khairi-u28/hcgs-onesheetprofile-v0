import Papa from "papaparse";

export function parseCsvRows(csvText: string) {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader(header: string) {
      return header.trim();
    },
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors.map((error) => error.message).join("; "));
  }

  return result.data;
}
