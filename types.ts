export interface TableInput {
  id: string;
  name: string;
  stats: string;
  schema: string;
  samples: string;
  rules: string;
}

export interface DataQualityInputs {
  tables: TableInput[];
  rules: string;
  history: string;
}

export interface Issue {
  table_name: string;
  type: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  possible_cause: string;
  impact: string;
  recommendation: string;
}

export interface GeminiApiResponse {
  issues_detected: Issue[];
}