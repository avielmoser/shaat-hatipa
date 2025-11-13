import fs from "fs";
import path from "path";

// קובץ לוגים יישמר רק בזמן פיתוח
const LOG_PATH = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_PATH, "api.log");

export function logEvent(
  label: string,
  data: Record<string, any>,
  includeSensitive = false
) {
  // הפעל רק בזמן פיתוח
  if (process.env.NODE_ENV === "production") return;

  try {
    if (!fs.existsSync(LOG_PATH)) {
      fs.mkdirSync(LOG_PATH);
    }

    const timestamp = new Date().toISOString();
    const safeData = includeSensitive ? data : sanitizeData(data);
    const logEntry = `[${timestamp}] ${label}: ${JSON.stringify(
      safeData,
      null,
      2
    )}\n`;

    fs.appendFileSync(LOG_FILE, logEntry, "utf8");
    console.log("📄 Log saved:", label);
  } catch (err) {
    console.error("Logging error:", err);
  }
}

// פונקציה שמסירה מידע רפואי מהלוג
function sanitizeData(data: Record<string, any>) {
  const cloned = JSON.parse(JSON.stringify(data));
  if (cloned.raw_ocr_text) cloned.raw_ocr_text = "[REDACTED]";
  if (cloned.medications) {
    cloned.medications = cloned.medications.map((m: any) => ({
      ...m,
      free_text_instructions: "[REDACTED]",
      warnings: m.warnings ? m.warnings.length : 0,
    }));
  }
  return cloned;
}
