export function sanitize(str) {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

export function validateRequired(value, fieldName) {
  if (!value || !value.toString().trim()) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validatePhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 10 || cleaned.length > 15) {
    return "Phone number must be between 10 and 15 digits";
  }
  return null;
}

export function validateEmail(email) {
  if (!email) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return "Invalid email address";
  }
  return null;
}

export function validateAmount(val) {
  const num = Number(val);
  if (isNaN(num) || num <= 0) {
    return "Amount must be a positive number";
  }
  return null;
}

export function validateNumber(val, fieldName) {
  const num = Number(val);
  if (isNaN(num) || num < 0) {
    return `${fieldName} must be a valid positive number`;
  }
  return null;
}

export async function checkDuplicate(supabase, table, column, value, excludeId = null) {
  let query = supabase.from(table).select("id").eq(column, value);
  if (excludeId) {
    query = query.neq("id", excludeId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return !!data;
}

export function validateFile(file, allowedTypes = ["image/jpeg", "image/jpg", "image/png"], maxSizeMB = 5) {
  if (!file) return null;
  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed: ${allowedTypes.map(t => t.split("/")[1]).join(", ")}`;
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File size must be under ${maxSizeMB}MB`;
  }
  return null;
}

export function formatCurrency(value) {
  const num = Number(value);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

/* ========== Dropdown / Enum Options ========== */

export const GENDER_OPTIONS = ["Male", "Female", "Other"];

export const CATEGORY_OPTIONS = ["General", "OBC", "SC", "ST", "EWS", "Other"];

export const CLASS_GROUPS = [
  { group: "Pre-Primary", values: ["Nursery", "LKG", "UKG"] },
  { group: "Primary", values: ["1", "2", "3", "4", "5"] },
  { group: "Middle", values: ["6", "7", "8"] },
  { group: "Secondary", values: ["9", "10"] },
  { group: "Higher Secondary", values: ["11", "12"] },
];

export const ALL_CLASSES = CLASS_GROUPS.flatMap((g) => g.values);

export function validateInList(value, list, fieldName) {
  if (!list.includes(value)) {
    return `Please select a valid ${fieldName}`;
  }
  return null;
}
