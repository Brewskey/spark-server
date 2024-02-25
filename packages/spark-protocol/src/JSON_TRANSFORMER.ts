export const JSON_TRANSFORMER = {
  from(val: string | null) {
    try {
      return typeof val === 'string' ? JSON.parse(val) : val;
    } catch (error) {
      console.error('JSON Error', val, error);
      throw error;
    }
  },
  to(val: Record<string, string> | null) {
    return val ? JSON.stringify(val) : val;
  },
} as const;
