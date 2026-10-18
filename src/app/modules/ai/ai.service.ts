import { GoogleGenAI } from '@google/genai';
import httpStatus from 'http-status';
import config from '../../config/index.ts';
import { AppError } from '../../utils/AppError.ts';

const ai = new GoogleGenAI({
  apiKey: config.gemini_api_key,
});

const academicAssistant = async (message: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are the Academic Assistant for a University Management System.

              Help students understand:
              - Course registration and prerequisites
              - Attendance and examinations
              - Fees and payment procedures
              - Results and transcripts
              - General university academic procedures

              Rules:
              - Be helpful, concise, professional and student-friendly.
              - Do not invent university policies, deadlines, fees or academic records.
              - If the question requires university-specific information that is not provided, clearly say that the student should consult the university administration or official system.
              - Never claim to have accessed a student's private account or records.
              - Do not request passwords, OTPs, payment credentials or other sensitive authentication information.
              - Return a valid JSON object matching the required response schema.
              - Put the answer in the "answer" field and helpful next steps in the "suggestions" array.
              - Do not use Markdown formatting inside the JSON string values.

              Student's question:
              ${message}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            answer: {
              type: 'STRING',
            },
            suggestions: {
              type: 'ARRAY',
              items: {
                type: 'STRING',
              },
            },
          },
          required: ['answer', 'suggestions'],
        },
      },
    });

    const responseText = response.text?.trim();

    if (!responseText) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'The AI assistant returned an empty response. Please try again.',
      );
    }

    let result: {
      answer: string;
      suggestions: string[];
    };

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'The AI assistant returned an invalid JSON response. Please try again.',
      );
    }

    if (
      typeof result.answer !== 'string' ||
      !Array.isArray(result.suggestions) ||
      !result.suggestions.every(
        (suggestion: unknown) => typeof suggestion === 'string',
      )
    ) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'The AI assistant returned an unexpected response format.',
      );
    }

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Gemini academic assistant request failed:', error);

    throw new AppError(
      httpStatus.BAD_GATEWAY,
      'The AI assistant is temporarily unavailable. Please try again later.',
    );
  }
};

export const AIService = {
  academicAssistant,
};
