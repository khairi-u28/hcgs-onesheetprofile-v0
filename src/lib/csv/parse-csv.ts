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
    const lines = csvText.split(/\r?\n/);
    const headerLine = lines[0] || "";
    const expectedFieldCount = (Papa.parse(headerLine, { header: false }) as Papa.ParseResult<string[]>).data[0]?.length ?? 0;

    result.errors.forEach((error) => {
      if (error.row !== undefined) {
        const rowNum = error.row + 2; // 1-based row number including header
        const rawRowText = lines[error.row + 1] || "";
        
        // Single row parse to get parsed field count
        const parsedSingle = Papa.parse(rawRowText, { header: false }) as Papa.ParseResult<string[]>;
        const parsedFieldCount = parsedSingle.data[0]?.length ?? 0;
        
        console.warn(
          `[CSV Parse Error] Row Number: ${rowNum} | ` +
          `Raw Row Text: ${rawRowText} | ` +
          `Parsed Field Count: ${parsedFieldCount} | ` +
          `Expected Field Count: ${expectedFieldCount}`
        );
      }
    });

    throw new Error(result.errors.map((error) => error.message).join("; "));
  }

  return result.data;
}
