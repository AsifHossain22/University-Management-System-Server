import { GoogleGenAI } from '@google/genai';
import httpStatus from 'http-status';
import config from '../../config/index.ts';
import { AppError } from '../../utils/AppError.ts';
import { prisma } from '../../../lib/prisma.ts';

const ai = new GoogleGenAI({
  apiKey: config.gemini_api_key,
});

// AcademicAssitant
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

// CourseRecommendations
const courseRecommendations = async (input: {
  interests: string;
  goals: string;
  programId?: string;
  preferredCredits?: number;
}) => {
  // RetrieveRealActiveCoursesFromDatabase
  const courses = await prisma.course.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      department: {
        isActive: true,
        deletedAt: null,
      },
      program: {
        isActive: true,
        deletedAt: null,
      },
      ...(input.programId ? { programId: input.programId } : {}),
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      credits: true,
      department: {
        select: {
          name: true,
          code: true,
        },
      },
      program: {
        select: {
          name: true,
          code: true,
        },
      },
      prerequisites: {
        select: {
          prerequisite: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
    take: 100,
    orderBy: {
      code: 'asc',
    },
  });

  if (courses.length === 0) {
    return {
      recommendations: [],
      message: 'No active courses were found for the selected criteria.',
    };
  }

  const catalog = courses.map(course => ({
    id: course.id,
    name: course.name,
    code: course.code,
    description: course.description,
    credits: course.credits,
    department: course.department.name,
    departmentCode: course.department.code,
    program: course.program.name,
    programCode: course.program.code,
    prerequisites: course.prerequisites.map(item => ({
      id: item.prerequisite.id,
      name: item.prerequisite.name,
      code: item.prerequisite.code,
    })),
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Recommend suitable courses using ONLY the supplied catalog.

              Student interests:
              ${input.interests}

              Student academic goals:
              ${input.goals}

              Preferred total credits:
              ${input.preferredCredits ?? 'Not specified'}

              Course catalog (authoritative source):
              ${JSON.stringify(catalog)}

              Rules:
              - Recommend only courses whose IDs appear in the supplied catalog.
              - Never invent course names, IDs, codes, credits, or prerequisites.
              - Return up to 5 relevant recommendations.
              - Explain why each course matches the student's interests or goals.
              - Consider the preferred credit amount when provided, but do not claim the combination satisfies official registration rules.
              - Prerequisite information is descriptive only. Do not claim the student has completed any prerequisite.
              - If no courses are relevant, return an empty recommendations array.
              - Return valid JSON matching the response schema.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            recommendations: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  courseId: {
                    type: 'STRING',
                  },
                  reason: {
                    type: 'STRING',
                  },
                },
                required: ['courseId', 'reason'],
              },
            },
          },
          required: ['recommendations'],
        },
      },
    });

    const text = response.text?.trim();

    if (!text) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'The AI assistant returned an empty recommendation response.',
      );
    }

    let result: {
      recommendations: {
        courseId: string;
        reason: string;
      }[];
    };

    try {
      result = JSON.parse(text);
    } catch {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'The AI assistant returned invalid recommendation data.',
      );
    }

    if (
      !result ||
      !Array.isArray(result.recommendations) ||
      !result.recommendations.every(
        item =>
          item &&
          typeof item.courseId === 'string' &&
          typeof item.reason === 'string',
      )
    ) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        'The AI assistant returned an unexpected recommendation format.',
      );
    }

    // RejectAnyIDsThatAreNotInRetrievedCatalog
    const catalogById = new Map(courses.map(course => [course.id, course]));

    const seen = new Set<string>();

    const recommendations = result.recommendations
      .filter(item => {
        if (!catalogById.has(item.courseId) || seen.has(item.courseId)) {
          return false;
        }

        seen.add(item.courseId);
        return true;
      })
      .slice(0, 5)
      .map(item => ({
        course: catalogById.get(item.courseId)!,
        reason: item.reason,
      }));

    return {
      recommendations,
      message:
        recommendations.length > 0
          ? 'Course recommendations generated successfully.'
          : 'No relevant courses were identified. Try adjusting your interests or goals.',
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Gemini course recommendation request failed:', error);

    throw new AppError(
      httpStatus.BAD_GATEWAY,
      'Course recommendations are temporarily unavailable.',
    );
  }
};

export const AIService = {
  academicAssistant,
  courseRecommendations,
};
