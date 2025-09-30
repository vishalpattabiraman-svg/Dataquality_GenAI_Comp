import { GoogleGenAI, Type } from '@google/genai';
import { DataQualityInputs, GeminiApiResponse } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const buildPrompt = (inputs: DataQualityInputs): string => {
  const tablesPrompt = inputs.tables.map((table, index) => `
    --- TABLE ${index + 1}: ${table.name || 'Unnamed Table'} ---

    1.  **Column-level statistics for ${table.name}:**
        \`\`\`
        ${table.stats || 'Not provided.'}
        \`\`\`

    2.  **Schema definitions for ${table.name}:**
        \`\`\`
        ${table.schema || 'Not provided.'}
        \`\`\`

    3.  **Sample data rows for ${table.name}:**
        \`\`\`
        ${table.samples || 'Not provided.'}
        \`\`\`

    4.  **Business rules for ${table.name}:**
        \`\`\`
        ${table.rules || 'Not provided.'}
        \`\`\`
  `).join('\n');

  return `
    You are a world-class Data Quality Bot integrated into a data engineering pipeline. 
    Your job is to analyze the following metadata and data profile reports to detect potential data quality issues, such as anomalies, null spikes, schema drift, or type mismatches.
    
    Analyze the following inputs to identify issues, rate their severity, suggest a cause, predict the impact, and recommend a solution.
    For each identified issue, you MUST specify the 'table_name' it pertains to, using the name provided in the input.

    **Inputs:**

    ${tablesPrompt}

    --- GLOBAL CONTEXT ---

    5.  **Global business rules (apply to all tables unless specified):**
        \`\`\`
        ${inputs.rules || 'Not provided.'}
        \`\`\`

    6.  **Historical anomalies or quality incidents (optional):**
        \`\`\`
        ${inputs.history || 'Not provided.'}
        \`\`\`

    Respond with a structured JSON output that conforms to the provided schema. If no issues are found, return an empty "issues_detected" array.
    `;
};

export const analyzeDataQuality = async (inputs: DataQualityInputs): Promise<GeminiApiResponse> => {
  const prompt = buildPrompt(inputs);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
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
                type: {
                  type: Type.STRING,
                  description: 'The type of issue, e.g., "Schema Drift", "Anomaly".',
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
      },
    },
  });
  
  const jsonText = response.text.trim();
  try {
    return JSON.parse(jsonText) as GeminiApiResponse;
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", jsonText);
    throw new Error("Received an invalid JSON response from the API.");
  }
};