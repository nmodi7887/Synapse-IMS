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
