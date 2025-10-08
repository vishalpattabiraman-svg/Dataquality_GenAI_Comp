import React, { useState } from 'react';
import { TableInput } from '../types';
import { TrashIcon } from './Icons';

interface TableInputFormProps {
  table: TableInput;
  index: number;
  onChange: (id: string, updatedTable: Partial<TableInput>) => void;
  onRemove: (id: string) => void;
}

const InputArea: React.FC<{
  id: keyof Omit<TableInput, 'id' | 'name'>;
  tableId: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}> = ({ id, tableId, label, placeholder, value, onChange, rows = 4 }) => (
  <div>
    <label htmlFor={`${id}-${tableId}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label}
    </label>
    <textarea
      id={`${id}-${tableId}`}
      name={id}
      rows={rows}
      className="block w-full shadow-sm sm:text-sm border-slate-300 rounded-md dark:bg-slate-800 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white focus:ring-brand-accent focus:border-brand-accent transition"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);


const TableInputForm: React.FC<TableInputFormProps> = ({ table, index, onChange, onRemove }) => {
  const [isCollapsed, setIsCollapsed] = useState(index > 0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(table.id, { [name]: value });
  };

  return (
    <div className="border border-slate-300 dark:border-slate-700 rounded-lg">
      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg">
        <div className="flex items-center flex-grow">
           <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
            aria-expanded={!isCollapsed}
           >
            <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
           </button>
           <input
            type="text"
            name="name"
            value={table.name}
            onChange={handleChange}
            placeholder="Enter table name"
            className="font-semibold text-slate-800 dark:text-white bg-transparent border-none focus:ring-0 w-full ml-2"
           />
        </div>
        <button
          type="button"
          onClick={() => onRemove(table.id)}
          className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 p-1 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/50"
          aria-label="Remove table"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          <InputArea
            id="stats"
            tableId={table.id}
            label="Column-level statistics"
            placeholder="e.g., min, max, null %, distinct count"
            value={table.stats}
            onChange={handleChange}
            rows={6}
          />
          <InputArea
            id="schema"
            tableId={table.id}
            label="Schema definitions / Columns"
            placeholder="e.g., CREATE TABLE statements, or 'Columns: col1, col2'"
            value={table.schema}
            onChange={handleChange}
          />
          <InputArea
            id="rules"
            tableId={table.id}
            label="Table-specific business rules (from WHERE clause)"
            placeholder="e.g., price > 0 AND status = 'completed'"
            value={table.rules}
            onChange={handleChange}
          />
          <InputArea
            id="samples"
            tableId={table.id}
            label="Sample data / Time-series metrics"
            placeholder="e.g., sample CSV rows, daily record counts"
            value={table.samples}
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  );
};

export default TableInputForm;