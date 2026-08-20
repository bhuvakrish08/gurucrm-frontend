/**
 * Utility functions for exporting formatted data to Excel with native numbers and dates.
 */

/**
 * Parses a date value (string, ISO, timestamp, or Date) into a JS Date object if valid,
 * otherwise returns an empty string.
 *
 * @param {any} val - The input value to parse
 * @returns {Date|string} - JS Date object if valid, else empty string
 */
export const parseExcelDate = (val) => {
  if (!val) return "";
  if (val instanceof Date) return isNaN(val.getTime()) ? "" : val;
  const date = new Date(val);
  return !isNaN(date.getTime()) ? date : "";
};

/**
 * Parses a numeric value (string, number) into a JS Number if valid,
 * otherwise returns fallback value (default empty string or 0).
 *
 * @param {any} val - The input value to parse
 * @param {any} fallback - Fallback value if parsing fails (default "")
 * @returns {number|any} - Clean numeric value or fallback
 */
export const parseExcelNumber = (val, fallback = "") => {
  if (val === null || val === undefined || val === "") return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  if (typeof val === "string") {
    // Clean string by removing currency symbols, spaces, commas
    const cleaned = val.replace(/[^0-9.-]/g, "");
    if (cleaned === "" || cleaned === "-") return fallback;
    const num = Number(cleaned);
    return !isNaN(num) ? num : fallback;
  }
  const num = Number(val);
  return !isNaN(num) ? num : fallback;
};

/**
 * Applies format strings (cell.z property) to worksheet columns by header name.
 * e.g., applyColumnFormats(XLSX, worksheet, exportData, { "Grand Total (₹)": "#,##0.00", "Proforma %": "0%" })
 *
 * @param {object} XLSX - SheetJS library module
 * @param {object} worksheet - SheetJS worksheet object
 * @param {Array<object>} exportData - Data array used for sheet creation
 * @param {object} columnFormats - Mapping of column header name -> format string (e.g. "#,##0.00", "0%")
 */
export const applyColumnFormats = (XLSX, worksheet, exportData, columnFormats = {}) => {
  if (!exportData || exportData.length === 0 || !worksheet || !XLSX) return;
  const headers = Object.keys(exportData[0] || {});

  headers.forEach((header, colIdx) => {
    const format = columnFormats[header];
    if (!format) return;

    const colLetter = XLSX.utils.encode_col(colIdx);
    for (let rowIdx = 2; rowIdx <= exportData.length + 1; rowIdx++) {
      const cellRef = `${colLetter}${rowIdx}`;
      if (worksheet[cellRef]) {
        worksheet[cellRef].z = format;
      }
    }
  });
};
