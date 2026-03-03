/**
 * Debug utility to identify non-serializable values in server action responses
 * Use this to find what's causing "unexpected response" errors
 */

export function findNonSerializable(value: any, path = ""): string[] {
  const errors: string[] = [];

  if (value === null || value === undefined) {
    return errors;
  }

  // Check for Date objects
  if (value instanceof Date) {
    errors.push(`Date object found at: ${path || "root"}`);
    return errors;
  }

  // Check for Firestore Timestamp
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    errors.push(`Firestore Timestamp found at: ${path || "root"}`);
    return errors;
  }

  // Check for functions
  if (typeof value === "function") {
    errors.push(`Function found at: ${path || "root"}`);
    return errors;
  }

  // Check for symbols
  if (typeof value === "symbol") {
    errors.push(`Symbol found at: ${path || "root"}`);
    return errors;
  }

  // Check for arrays
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      errors.push(...findNonSerializable(item, `${path}[${index}]`));
    });
    return errors;
  }

  // Check for objects
  if (typeof value === "object") {
    try {
      // Try to serialize to find circular references
      JSON.stringify(value);
    } catch (err: any) {
      if (err.message.includes("circular")) {
        errors.push(`Circular reference found at: ${path || "root"}`);
      } else {
        errors.push(`Serialization error at ${path || "root"}: ${err.message}`);
      }
      return errors;
    }

    // Recursively check nested objects
    for (const [key, val] of Object.entries(value)) {
      errors.push(...findNonSerializable(val, path ? `${path}.${key}` : key));
    }
  }

  return errors;
}

/**
 * Test if a value is serializable and return detailed error information
 */
export function testSerialization(value: any): {
  isSerializable: boolean;
  errors: string[];
  serialized: any | null;
} {
  const errors = findNonSerializable(value);

  if (errors.length > 0) {
    return {
      isSerializable: false,
      errors,
      serialized: null,
    };
  }

  try {
    const serialized = JSON.stringify(value);
    const parsed = JSON.parse(serialized);
    return {
      isSerializable: true,
      errors: [],
      serialized: parsed,
    };
  } catch (err: any) {
    return {
      isSerializable: false,
      errors: [`JSON.stringify failed: ${err.message}`],
      serialized: null,
    };
  }
}
