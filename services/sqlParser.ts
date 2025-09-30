import { TableInput } from '../types';

export type ParsedTableInfo = Omit<TableInput, 'id' | 'stats' | 'samples'>;

/**
 * A simple SQL parser to extract table name, columns, and WHERE clause.
 * This is not a full-fledged parser and works for basic SELECT statements.
 * @param sql The raw SQL string, which can contain multiple statements separated by ';'.
 * @returns An array of parsed table information objects.
 */
export const parseSql = (sql: string): ParsedTableInfo[] => {
  const statements = sql.split(';').filter(s => s.trim() !== '');

  return statements.map(statement => {
    // Normalize whitespace for easier regex matching
    const cleanStatement = statement.replace(/\s\s+/g, ' ').trim();

    // Extract table name from FROM clause. This regex handles simple names (table),
    // schema-qualified names (schema.table), and quoted identifiers (`"`, ` ` `, `[]`).
    const fromMatch = cleanStatement.match(/\bFROM\s+((?:\w+|"[^"]+"|`[^`]+`|\[[^\]]+\])(?:\.(?:\w+|"[^"]+"|`[^`]+`|\[[^\]]+\]))*)/i);
    const tableName = fromMatch ? fromMatch[1] : 'unknown_table';

    // Extract columns from SELECT clause
    const selectMatch = cleanStatement.match(/\bSELECT\s+(.*?)\s+\bFROM\b/i);
    let columnsText = 'Could not parse columns.';
    if (selectMatch && selectMatch[1]) {
      if (selectMatch[1].trim() === '*') {
         columnsText = 'All columns (*)'
      } else {
        const columns = selectMatch[1]
          .split(',')
          .map(c => {
            const parts = c.trim().split(/\s+/);
            // Handles "col as alias" -> "alias", "schema.col" -> "col"
            let colName = parts[parts.length - 1];
            if (colName.includes('.')) {
                colName = colName.substring(colName.lastIndexOf('.') + 1);
            }
            return colName;
          })
          .join(', ');
        columnsText = `Columns: ${columns}`;
      }
    }
    
    // Extract rules from WHERE clause
    const whereMatch = cleanStatement.match(/\bWHERE\s+(.*?)(?:\bGROUP BY\b|\bORDER BY\b|\bLIMIT\b|$)/i);
    const rules = whereMatch && whereMatch[1] ? whereMatch[1].trim() : '';

    return {
      name: tableName,
      schema: columnsText,
      rules: rules,
    };
  });
};
