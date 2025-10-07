import { GoogleGenAI, Type } from '@google/genai';
import { DataQualityInputs, GeminiApiResponse, Issue, TableInput } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// New function to build prompt for a single table
const buildSingleTablePrompt = (table: TableInput, globalRules: string, history: string): string => {
  const tablePrompt = `
    --- TABLE: ${table.name || 'Unnamed Table'} ---

    1.  **Column-level statistics:**
        \`\`\`
        ${table.stats || 'Not provided.'}
        \`\`\`

    2.  **Schema definitions:**
        \`\`\`
        ${table.schema || 'Not provided.'}
        \`\`\`

    3.  **Sample data rows:**
        \`\`\`
        ${table.samples || 'Not provided.'}
        \`\`\`

    4.  **Business rules for this table:**
        \`\`\`
        ${table.rules || 'Not provided.'}
        \`\`\`
  `;

  return `
    You are a world-class Data Quality Bot integrated into a data engineering pipeline. 
    Your job is to analyze the following metadata and data profile report for a SINGLE TABLE to detect potential data quality issues, such as anomalies, null spikes, schema drift, or type mismatches.
    
    Analyze the following inputs to identify issues, rate their severity, suggest a cause, predict the impact, and recommend a solution.
    For each identified issue, you MUST specify the 'table_name' as exactly "${table.name}". If an issue is specific to a single column, you MUST also provide the 'column_name'.

    IMPORTANT: If an issue is a direct violation of one of the provided business rules (either from this table's "Business rules" section or the "Global business rules"), you MUST set the issue's 'type' to exactly "Business Rule Violation". For all other issues, use a descriptive type.

    **Inputs for table "${table.name}":**

    ${tablePrompt}

    --- GLOBAL CONTEXT ---

    5.  **Global business rules (apply to this table):**
        \`\`\`
        ${globalRules || 'Not provided.'}
        \`\`\`

    6.  **Historical anomalies or quality incidents (optional context):**
        \`\`\`
        ${history || 'Not provided.'}
        \`\`\`

    Respond with a structured JSON output that conforms to the provided schema. If no issues are found, return an empty "issues_detected" array.
    `;
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    issues_detected: {
      type: Type.ARRAY,
      description: 'A list of detected data quality issues.',
      items: {
        type: Type.OBJECT,
        properties: {
          table_name: {
            type: Type.STRING,
            description: 'The name of the table where the issue was found.',
          },
          column_name: {
            type: Type.STRING,
            description: 'The name of the column where the issue was found, if applicable.',
          },
          type: {
            type: Type.STRING,
            description: 'The type of issue, e.g., "Schema Drift", "Anomaly", "Business Rule Violation".',
          },
          description: {
            type: Type.STRING,
            description: 'A detailed description of the detected issue.',
          },
          severity: {
            type: Type.STRING,
            description: 'The severity rating: "Low", "Medium", or "High".',
          },
          possible_cause: {
            type: Type.STRING,
            description: 'A likely cause for the issue.',
          },
          impact: {
            type: Type.STRING,
            description: 'Potential impact on downstream processes.',
          },
          recommendation: {
            type: Type.STRING,
            description: 'Recommended steps for remediation.',
          },
        },
        required: ['table_name', 'type', 'description', 'severity', 'possible_cause', 'impact', 'recommendation'],
      },
    },
  },
  required: ['issues_detected'],
};

// New helper function to analyze a single table
const analyzeSingleTable = async (table: TableInput, globalRules: string, history: string): Promise<GeminiApiResponse> => {
  const prompt = buildSingleTablePrompt(table, globalRules, history);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0,
        seed: 42,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });
    
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as GeminiApiResponse;
    
    // Defensive check: ensure the model has correctly set the table name on all issues.
    result.issues_detected.forEach(issue => {
      if (!issue.table_name) {
        issue.table_name = table.name;
      }
    });

    return result;
  } catch (e) {
    console.error(`Error analyzing table "${table.name}":`, e);
    // Return an empty result for this table to not fail the entire batch
    return { issues_detected: [] };
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// The main function, now refactored to orchestrate sequential calls
export const analyzeDataQuality = async (inputs: DataQualityInputs): Promise<GeminiApiResponse> => {
  // If there are no tables, return immediately.
  if (!inputs.tables || inputs.tables.length === 0) {
    return { issues_detected: [] };
  }

  const allIssues: Issue[] = [];
  for (const [index, table] of inputs.tables.entries()) {
    // Process tables one by one to avoid hitting API rate limits.
    const result = await analyzeSingleTable(table, inputs.rules, inputs.history);
    if (result && result.issues_detected) {
      allIssues.push(...result.issues_detected);
    }
    
    // Add a small delay between requests to respect API rate limits,
    // but don't delay after the very last request.
    if (index < inputs.tables.length - 1) {
      await delay(1000); // 1-second delay
    }
  }
  
  return { issues_detected: allIssues };
};

export const generateReportSummary = async (issues: Issue[]): Promise<string> => {
  const prompt = `
    You are a senior data analyst. Based on the following JSON data quality report, generate a well-structured executive summary in markdown format. 
    The summary should:
    1.  Start with a high-level overview of the findings.
    2.  Identify the most critical issues (prioritizing 'High' severity).
    3.  Point out any recurring themes or patterns (e.g., specific tables with many issues, common issue types like 'Schema Drift').
    4.  Conclude with a summary of the overall data health and a call to action.
    
    Structure your response with clear headings (e.g., "### Key Findings"). Use bullet points for clarity.
    Your analysis must be based ONLY on the data provided.

    **Data Quality Issues JSON:**
    \`\`\`json
    ${JSON.stringify(issues, null, 2)}
    \`\`\`
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.2,
    },
  });

  return response.text;
};