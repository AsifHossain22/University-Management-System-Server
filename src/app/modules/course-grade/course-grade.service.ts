import httpStatus from 'http-status';
import { prisma } from '../../../lib/prisma.ts';
import { AppError } from '../../utils/AppError.ts';

const PASSING_MARKS = 40;
const WEIGHT_TOLERANCE = 0.01;

type GradeResult = {
  grade: string;
  gradePoint: number;
  isPassed: boolean;
};

// GetGrade
const getGrade = (marks: number): GradeResult => {
  if (marks >= 80) {
    return { grade: 'A+', gradePoint: 4.0, isPassed: true };
  }

  if (marks >= 75) {
    return { grade: 'A', gradePoint: 3.75, isPassed: true };
  }

  if (marks >= 70) {
    return { grade: 'A-', gradePoint: 3.5, isPassed: true };
  }

  if (marks >= 65) {
    return { grade: 'B+', gradePoint: 3.25, isPassed: true };
  }

  if (marks >= 60) {
    return { grade: 'B', gradePoint: 3.0, isPassed: true };
  }

  if (marks >= 55) {
    return { grade: 'B-', gradePoint: 2.75, isPassed: true };
  }

  if (marks >= 50) {
    return { grade: 'C+', gradePoint: 2.5, isPassed: true };
  }

  if (marks >= 45) {
    return { grade: 'C', gradePoint: 2.25, isPassed: true };
  }

  if (marks >= PASSING_MARKS) {
    return { grade: 'D', gradePoint: 2.0, isPassed: true };
  }

  return { grade: 'F', gradePoint: 0.0, isPassed: false };
};

// RoundMarks
const roundMarks = (marks: number) =>
  Math.round((marks + Number.EPSILON) * 100) / 100;

// PublishSectionGrades
const publishSectionGrades = async (sectionId: string) => {
  return prisma.$transaction(
    async tx => {
      // GetSectionAndResults
      const section = await tx.section.findFirst({
        where: {
          id: sectionId,
          isActive: true,
          deletedAt: null,
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
            },
          },
          exams: {
            where: {
              isActive: true,
              deletedAt: null,
            },
            select: {
              id: true,
              title: true,
              totalMarks: true,
              passingMarks: true,
              weight: true,
            },
          },
          registrations: {
            where: {
              status: {
                in: ['REGISTERED', 'COMPLETED'],
              },
            },
            include: {
              results: {
                where: {
                  isActive: true,
                  deletedAt: null,
                },
                select: {
                  id: true,
                  examId: true,
                  obtainedMarks: true,
                },
              },
            },
          },
        },
      });

      // ValidateSection
      if (!section) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          'Section not found or inactive!',
        );
      }

      const { exams, registrations } = section;

      // ValidateActiveExams
      if (exams.length === 0) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Cannot publish grades because the section has no active exams.',
        );
      }

      // ValidateExamMarksAndWeights
      if (
        exams.some(
          exam =>
            !Number.isFinite(exam.totalMarks) ||
            exam.totalMarks <= 0 ||
            !Number.isFinite(exam.weight) ||
            exam.weight < 0,
        )
      ) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Active exams must have positive total marks and valid non-negative weights.',
        );
      }

      // ValidateTotalExamWeight
      const totalWeight = exams.reduce((sum, exam) => sum + exam.weight, 0);

      if (Math.abs(totalWeight - 100) > WEIGHT_TOLERANCE) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Active exam weights must total 100%. Current total: ${roundMarks(totalWeight)}%.`,
        );
      }

      // ValidateEligibleStudents
      if (registrations.length === 0) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Cannot publish grades because the section has no eligible students.',
        );
      }

      // PrepareGrades
      const examIds = new Set(exams.map(exam => exam.id));

      const missingResults: string[] = [];

      const calculatedGrades: Array<{
        registrationId: string;
        finalMarks: number;
        grade: string;
        gradePoint: number;
        isPassed: boolean;
      }> = [];

      // CalculateGrades
      for (const registration of registrations) {
        const resultByExamId = new Map(
          registration.results
            .filter(result => examIds.has(result.examId))
            .map(result => [result.examId, result]),
        );

        const missingExams = exams.filter(exam => !resultByExamId.has(exam.id));

        if (missingExams.length > 0) {
          missingResults.push(
            `${registration.id}: ${missingExams
              .map(exam => exam.title)
              .join(', ')}`,
          );

          continue;
        }

        let weightedMarks = 0;

        for (const exam of exams) {
          const result = resultByExamId.get(exam.id);

          if (!result) {
            continue;
          }

          // ValidateObtainedMarks
          if (
            !Number.isFinite(result.obtainedMarks) ||
            result.obtainedMarks < 0 ||
            result.obtainedMarks > exam.totalMarks
          ) {
            throw new AppError(
              httpStatus.BAD_REQUEST,
              `Invalid result marks for exam "${exam.title}" in registration ${registration.id}.`,
            );
          }

          // CalculateWeightedMarks
          weightedMarks +=
            (result.obtainedMarks / exam.totalMarks) * exam.weight;
        }

        const finalMarks = roundMarks(weightedMarks);
        const gradeDetails = getGrade(finalMarks);

        calculatedGrades.push({
          registrationId: registration.id,
          finalMarks,
          ...gradeDetails,
        });
      }

      // RejectIncompleteResults
      if (missingResults.length > 0) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Grades cannot be published. Missing active exam results: ${missingResults.slice(0, 10).join('; ')}${missingResults.length > 10 ? '; and more' : ''}.`,
        );
      }

      // SavePublishedGrades
      const publishedAt = new Date();

      const grades = [];

      for (const grade of calculatedGrades) {
        const savedGrade = await tx.courseGrade.upsert({
          where: {
            registrationId: grade.registrationId,
          },
          create: {
            registrationId: grade.registrationId,
            finalMarks: grade.finalMarks,
            grade: grade.grade,
            gradePoint: grade.gradePoint,
            isPassed: grade.isPassed,
            publishedAt,
          },
          update: {
            finalMarks: grade.finalMarks,
            grade: grade.grade,
            gradePoint: grade.gradePoint,
            isPassed: grade.isPassed,
            publishedAt,
          },
        });

        grades.push(savedGrade);
      }

      // ReturnPublicationSummary
      return {
        section: {
          id: section.id,
          name: section.name,
          code: section.code,
          course: section.course,
          semesterId: section.semesterId,
        },
        summary: {
          eligibleStudents: registrations.length,
          publishedGrades: grades.length,
          passingStudents: grades.filter(grade => grade.isPassed).length,
          failingStudents: grades.filter(grade => !grade.isPassed).length,
          publishedAt,
        },
        grades,
      };
    },
    {
      maxWait: 5000,
      timeout: 15000,
    },
  );
};

// GetMyTranscript
const getMyTranscript = async (userId: string) => {
  // GetStudent
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      studentId: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student profile not found!');
  }

  // GetPublishedRegistrations
  const registrations = await prisma.courseRegistration.findMany({
    where: {
      studentId: student.id,
      courseGrade: {
        is: {
          publishedAt: {
            not: null,
          },
        },
      },
    },
    select: {
      id: true,
      courseGrade: {
        select: {
          id: true,
          finalMarks: true,
          grade: true,
          gradePoint: true,
          isPassed: true,
          publishedAt: true,
        },
      },
      section: {
        select: {
          id: true,
          name: true,
          code: true,
          course: {
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
            },
          },
          semester: {
            select: {
              id: true,
              name: true,
              code: true,
              startDate: true,
            },
          },
        },
      },
    },
  });

  // ValidateCourseCredits
  if (
    registrations.some(
      registration =>
        !Number.isFinite(registration.section.course.credits) ||
        registration.section.course.credits < 0,
    )
  ) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid course credits found while calculating transcript.',
    );
  }

  // TranscriptCourseType
  type TranscriptCourse = {
    id: string;
    finalMarks: number;
    grade: string;
    gradePoint: number;
    isPassed: boolean;
    publishedAt: Date;
    course: {
      id: string;
      name: string;
      code: string;
      credits: number;
    };
    section: {
      id: string;
      name: string;
      code: string;
    };
    semester: {
      id: string;
      name: string;
      code: string;
      startDate: Date;
    };
  };

  // GroupCoursesBySemester
  const semesterMap = new Map<
    string,
    {
      semester: TranscriptCourse['semester'];
      courses: TranscriptCourse[];
    }
  >();

  for (const registration of registrations) {
    const grade = registration.courseGrade;

    if (!grade?.publishedAt) {
      continue;
    }

    const { section } = registration;
    const { semester, course } = section;

    const transcriptCourse: TranscriptCourse = {
      id: grade.id,
      finalMarks: grade.finalMarks,
      grade: grade.grade,
      gradePoint: grade.gradePoint,
      isPassed: grade.isPassed,
      publishedAt: grade.publishedAt,
      course,
      section: {
        id: section.id,
        name: section.name,
        code: section.code,
      },
      semester,
    };

    const semesterEntry = semesterMap.get(semester.id);

    if (semesterEntry) {
      semesterEntry.courses.push(transcriptCourse);
    } else {
      semesterMap.set(semester.id, {
        semester,
        courses: [transcriptCourse],
      });
    }
  }

  // CalculateSemesterGPAs
  const roundGPA = (value: number) =>
    Math.round((value + Number.EPSILON) * 100) / 100;

  const semesters = Array.from(semesterMap.values())
    .sort(
      (a, b) => a.semester.startDate.getTime() - b.semester.startDate.getTime(),
    )
    .map(({ semester, courses }) => {
      const totalCredits = courses.reduce(
        (sum, item) => sum + item.course.credits,
        0,
      );

      const weightedGradePoints = courses.reduce(
        (sum, item) => sum + item.course.credits * item.gradePoint,
        0,
      );

      const creditsEarned = courses.reduce(
        (sum, item) => sum + (item.isPassed ? item.course.credits : 0),
        0,
      );

      return {
        semester: {
          id: semester.id,
          name: semester.name,
          code: semester.code,
        },
        semesterGPA:
          totalCredits > 0 ? roundGPA(weightedGradePoints / totalCredits) : 0,
        creditsEarned,
        courses: courses.map(({ semester: _semester, ...course }) => course),
      };
    });

  // CalculateCumulativeGPA
  const allCourses = semesters.flatMap(semester => semester.courses);

  const totalCreditsAttempted = allCourses.reduce(
    (sum, course) => sum + course.course.credits,
    0,
  );

  const totalWeightedGradePoints = allCourses.reduce(
    (sum, course) => sum + course.course.credits * course.gradePoint,
    0,
  );

  const totalCreditsEarned = allCourses.reduce(
    (sum, course) => sum + (course.isPassed ? course.course.credits : 0),
    0,
  );

  // ReturnTranscript
  return {
    student: {
      studentId: student.studentId,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
    },
    semesters,
    cumulativeGPA:
      totalCreditsAttempted > 0
        ? roundGPA(totalWeightedGradePoints / totalCreditsAttempted)
        : 0,
    totalCreditsEarned,
  };
};

export const CourseGradeService = {
  publishSectionGrades,
  getMyTranscript,
};
