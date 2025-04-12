
/**
 * Utility type for safely typing Supabase queries.
 * This helps avoid TypeScript errors with Supabase's PostgresBuilder where string 
 * parameters are expected to match exactly.
 */

export type PostgresFilter = string | number | boolean | null;

/**
 * Safe type cast for Supabase query filter values.
 * Use this when TypeScript complains about filter parameters in Supabase queries.
 * 
 * @example
 * .eq('column_name', filterValue(value))
 */
export function filterValue<T>(value: T): string {
  // Convert the value to string to ensure compatibility with Supabase queries
  return String(value);
}

/**
 * Safely handle Supabase query data by checking for error before accessing properties.
 * This is a helper to avoid TS errors when accessing properties on data that might be an error.
 * 
 * @example
 * const { data, error } = await supabase.from('table').select('*').single();
 * if (error) throw error;
 * const safeData = safeDatabaseData(data);
 * // Now you can safely access properties on safeData
 */
export function safeDatabaseData<T>(data: T): NonNullable<T> {
  if (!data) {
    throw new Error('Database query returned no data');
  }
  return data as NonNullable<T>;
}
