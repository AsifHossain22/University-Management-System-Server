import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError.ts';
import { SectionService } from './section.service.ts';
import {
  createSectionSchema,
  sectionQuerySchema,
  updateSectionSchema,
} from './section.validation.ts';

// CreateSection
const createSection = async (req: Request, res: Response) => {
  const payload = createSectionSchema.parse(req.body);

  const result = await SectionService.createSection(payload);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Section created successfully!',
    data: result,
  });
};

// GetAllSections
const getSections = async (req: Request, res: Response) => {
  const query = sectionQuerySchema.parse(req.query);

  const result = await SectionService.getSections(query);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Sections retrieved successfully!',
    data: result,
  });
};

// GetSectionById
const getSectionById = async (req: Request, res: Response) => {
  const sectionId = req.params.id;

  if (!sectionId || Array.isArray(sectionId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid section ID!');
  }

  const result = await SectionService.getSectionById(sectionId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Section retrieved successfully!',
    data: result,
  });
};

// UpdateSection
const updateSection = async (req: Request, res: Response) => {
  const sectionId = req.params.id;

  if (!sectionId || Array.isArray(sectionId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid section ID!');
  }

  const payload = updateSectionSchema.parse(req.body);

  const result = await SectionService.updateSection(sectionId, payload);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Section updated successfully!',
    data: result,
  });
};

// DeleteSection
const deleteSection = async (req: Request, res: Response) => {
  const sectionId = req.params.id;

  if (!sectionId || Array.isArray(sectionId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid section ID!');
  }

  const result = await SectionService.softDeleteSection(sectionId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Section deleted successfully!',
    data: result,
  });
};

export const SectionController = {
  createSection,
  getSections,
  getSectionById,
  updateSection,
  deleteSection,
};
