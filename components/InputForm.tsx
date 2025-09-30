import React from 'react';
import { DataQualityInputs, TableInput } from '../types';
import { SparklesIcon, PlusIcon, CodeIcon, UploadIcon } from './Icons';
import TableInputForm from './TableInputForm';
import { parseSql } from '../services/sqlParser';

interface InputFormProps {
  onAnalyze: (inputs: DataQualityInputs) => void;
  isLoading: boolean;
}

const InputArea: React.FC<{
  id: keyof DataQualityInputs;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}> = ({ id, label, placeholder, value, onChange, rows = 3 }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <textarea
      id={id}
      name={id}
      rows={rows}
      className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white focus:ring-brand-accent focus:border-brand-accent transition"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

const InputForm: React.FC<InputFormProps> = ({ onAnalyze, isLoading }) => {
  const [inputs, setInputs] = React.useState<DataQualityInputs>({
    tables: [
      {
        id: crypto.randomUUID(),
        name: 'customer_orders',
        stats: `Column, Null %, Distinct Count, Min, Max
order_id, 0%, 10000, 1, 10000
customer_age, 5%, 60, 18, 78
order_amount, 28%, 4500, 10.50, 950.00`,
        schema: `-- Previous Schema
CREATE TABLE customer_orders (
  order_id INT,
  customer_age INT,
  order_amount DECIMAL(10, 2)
);

-- Current Schema
CREATE TABLE customer_orders (
  order_id INT,
  customer_age STRING, 
  order_amount DECIMAL(10, 2),
  shipping_address STRING
);`,
        samples: `order_id,customer_age,order_amount,shipping_address
1001,"25",150.75,"123 Maple St"
1002,"42",89.99,"456 Oak Ave"
1003,"thirty-one",, "789 Pine Ln"
1004,"28",215.50,"321 Elm Ct"`,
        rules: 'order_amount must be > 0. customer_age must be a valid integer between 18 and 120.',
      },
    ],
    rules: '',
    history: '',
  });

  const handleTableChange = (id: string, updatedTable: Partial<TableInput>) => {
    setInputs((prev) => ({
      ...prev,
      tables: prev.tables.map((table) => (table.id === id ? { ...table, ...updatedTable } : table)),
    }));
  };
  
  const handleGlobalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSqlFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const sqlContent = e.target?.result as string;
        if (sqlContent) {
            const parsedInfos = parseSql(sqlContent);
            const newTables: TableInput[] = parsedInfos.map(info => ({
              id: crypto.randomUUID(),
              name: info.name,
              schema: info.schema,
              rules: info.rules,
              stats: '',
              samples: '',
            }));
            setInputs(prev => ({...prev, tables: newTables}));
        }
    };
    reader.onerror = () => {
        console.error("Error reading SQL file.");
        alert("An error occurred while reading the SQL file.");
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const normalizeTableName = (name: string) => {
    return name.replace(/[`"\[\]]/g, '').toLowerCase();
  };

  const handleParseAndDistributeStats = (fileContent: string) => {
    if (!fileContent.trim()) return;

    const lines = fileContent.trim().split('\n');
    if (lines.length < 2) {
      alert("Statistics CSV must have a header row and at least one data row.");
      return;
    }

    const headerLine = lines[0];
    const delimiter = ','; // Assume CSV
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    
    const findIndex = (possibleNames: string[]) => {
      for(const name of possibleNames) {
        const index = headers.indexOf(name);
        if (index > -1) return index;
      }
      return -1;
    };

    const colIndices = {
      schema: findIndex(['schema']),
      table: findIndex(['table']),
      column: findIndex(['column']),
      dataType: findIndex(['data type', 'datatype']),
      nullPercent: findIndex(['null %', 'null%']),
      distinctCount: findIndex(['distinct count', 'distinctcount']),
      min: findIndex(['min']),
      max: findIndex(['max']),
    };

    if (colIndices.table === -1 || colIndices.column === -1) {
      alert("Statistics CSV must contain 'Table' and 'Column' headers.");
      return;
    }

    const statsByTable: { [normalizedTableName: string]: string[] } = {};
    const dataRows = lines.slice(1);

    dataRows.forEach(line => {
      if (!line.trim()) return;
      const cells = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
      
      const schema = colIndices.schema !== -1 ? cells[colIndices.schema] : null;
      const tableName = cells[colIndices.table];

      if (!tableName) return;
      
      const fullTableName = schema && schema.toLowerCase() !== 'n/a' ? `${schema}.${tableName}` : tableName;
      const normalizedTableName = normalizeTableName(fullTableName);
      
      const getCell = (index: number) => index !== -1 ? (cells[index] || 'N/A') : 'N/A';
      
      const statLine = [
        getCell(colIndices.column),
        getCell(colIndices.dataType),
        getCell(colIndices.nullPercent),
        getCell(colIndices.distinctCount),
        getCell(colIndices.min),
        getCell(colIndices.max),
      ].join(', ');

      if (!statsByTable[normalizedTableName]) {
        statsByTable[normalizedTableName] = [];
      }
      statsByTable[normalizedTableName].push(statLine);
    });

    setInputs(prev => {
      const newTables = prev.tables.map(table => {
        const normalizedCurrentTableName = normalizeTableName(table.name);
        const newStats = statsByTable[normalizedCurrentTableName];

        if (newStats) {
          const statHeader = 'Column, Data Type, Null %, Distinct Count, Min, Max';
          return {
            ...table,
            stats: `${statHeader}\n${newStats.join('\n')}`,
          };
        }
        return table;
      });
      return {...prev, tables: newTables};
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
            handleParseAndDistributeStats(text);
        }
    };
    reader.onerror = () => {
        console.error("Error reading file.");
        alert("An error occurred while reading the file.");
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const addTable = () => {
    setInputs((prev) => ({
      ...prev,
      tables: [
        ...prev.tables,
        { id: crypto.randomUUID(), name: `new_table_${prev.tables.length + 1}`, stats: '', schema: '', samples: '', rules: '' },
      ],
    }));
  };

  const removeTable = (id: string) => {
    setInputs((prev) => ({
      ...prev,
      tables: prev.tables.filter((table) => table.id !== id),
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(inputs);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Provide Data Context</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add tables manually or generate them from SQL and statistics.</p>
      </div>

      <div className="space-y-4 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">Import from SQL</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
          Upload a .sql file to automatically generate table structures.
        </p>
        <div>
          <label htmlFor="sql-upload" className="w-full cursor-pointer inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-accent hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition">
            <UploadIcon className="w-5 h-5 mr-2 -ml-1" />
            Upload SQL File
          </label>
          <input
            id="sql-upload"
            type="file"
            accept=".sql,text/plain"
            className="hidden"
            onChange={handleSqlFileChange}
          />
        </div>
      </div>

      <div className="space-y-4 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">Import Column Statistics</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
          Upload a CSV file with statistics. Must include 'Table' and 'Column' headers.
        </p>
        <div>
          <label htmlFor="stats-upload" className="w-full cursor-pointer inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-accent hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition">
            <UploadIcon className="w-5 h-5 mr-2 -ml-1" />
            Upload Statistics CSV
          </label>
          <input
            id="stats-upload"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="space-y-4">
        {inputs.tables.map((table, index) => (
          <TableInputForm 
            key={table.id}
            table={table}
            index={index}
            onChange={handleTableChange}
            onRemove={removeTable}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addTable}
        className="w-full inline-flex justify-center items-center px-4 py-2 border border-dashed border-gray-400 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition"
      >
        <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
        Add Another Table
      </button>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">Global Context</h3>
        <InputArea
          id="rules"
          label="Global business rules (optional)"
          placeholder="e.g., All ID columns must be universally unique"
          value={inputs.rules}
          onChange={handleGlobalChange}
        />
        <InputArea
          id="history"
          label="Historical anomalies (optional)"
          placeholder="e.g., 'Last week, user_id had a 10% null spike'"
          value={inputs.history}
          onChange={handleGlobalChange}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || inputs.tables.length === 0}
        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:bg-gray-400 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900 transition-all duration-300"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 mr-2 -ml-1" />
            Analyze Data Quality
          </>
        )}
      </button>
    </form>
  );
};

export default InputForm;