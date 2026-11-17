import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBusDto } from './dto/create-bus.dto.js';
import { UpdateBusDto } from './dto/update-bus.dto.js';
import { BusModel, BusModelDocument } from './bus.schema.js';

export const APPROVED_SPECIFICATIONS: Record<
  string,
  Record<string, { capacity: number; layoutDetails: any }>
> = {
  first_class: {
    large: {
      capacity: 30,
      layoutDetails: { rows: 10, seatsPerRow: 3, type: 'first_class_large' },
    },
    medium: {
      capacity: 20,
      layoutDetails: { rows: 10, seatsPerRow: 2, type: 'first_class_medium' },
    },
  },
  business_class: {
    large: {
      capacity: 40,
      layoutDetails: { rows: 10, seatsPerRow: 4, type: 'business_class_large' },
    },
    medium: {
      capacity: 30,
      layoutDetails: { rows: 10, seatsPerRow: 3, type: 'business_class_medium' },
    },
  },
  economy_class: {
    large: {
      capacity: 50,
      layoutDetails: { rows: 10, seatsPerRow: 5, type: 'economy_class_large' },
    },
    medium: {
      capacity: 40,
      layoutDetails: { rows: 10, seatsPerRow: 4, type: 'economy_class_medium' },
    },
  },
};

export const PREDEFINED_BUS_MODELS = [
  {
    category: 'first_class',
    size: 'large',
    capacity: 30,
    layoutDetails: { rows: 10, seatsPerRow: 3, type: 'first_class_large' },
    totalBusesCount: 5,
  },
  {
    category: 'first_class',
    size: 'medium',
    capacity: 20,
    layoutDetails: { rows: 10, seatsPerRow: 2, type: 'first_class_medium' },
    totalBusesCount: 5,
  },
  {
    category: 'business_class',
    size: 'large',
    capacity: 40,
    layoutDetails: { rows: 10, seatsPerRow: 4, type: 'business_class_large' },
    totalBusesCount: 10,
  },
  {
    category: 'business_class',
    size: 'medium',
    capacity: 30,
    layoutDetails: { rows: 10, seatsPerRow: 3, type: 'business_class_medium' },
    totalBusesCount: 10,
  },
  {
    category: 'economy_class',
    size: 'large',
    capacity: 50,
    layoutDetails: { rows: 10, seatsPerRow: 5, type: 'economy_class_large' },
    totalBusesCount: 15,
  },
  {
    category: 'economy_class',
    size: 'medium',
    capacity: 40,
    layoutDetails: { rows: 10, seatsPerRow: 4, type: 'economy_class_medium' },
    totalBusesCount: 15,
  },
];

export const validateBusModelInput = (data: any, isUpdate = false) => {
  const errors: string[] = [];
  const { category, size, capacity, layoutDetails, totalBusesCount } = data || {};

  if (!isUpdate || category !== undefined) {
    if (!category || !['first_class', 'business_class', 'economy_class'].includes(category)) {
      errors.push('Category must be one of: first_class, business_class, economy_class');
    }
  }

  if (!isUpdate || size !== undefined) {
    if (!size || !['large', 'medium'].includes(size)) {
      errors.push('Size must be one of: large, medium');
    }
  }

  // If category and size are present, validate capacity against approved specifications
  const activeCategory = category;
  const activeSize = size;
  const categorySpecs = activeCategory ? APPROVED_SPECIFICATIONS[activeCategory] : null;
  const expectedSpec = categorySpecs && activeSize ? categorySpecs[activeSize] : null;

  if (activeCategory && activeSize && expectedSpec) {
    if (capacity !== undefined && Number(capacity) !== expectedSpec.capacity) {
      errors.push(`Capacity for ${activeCategory} (${activeSize}) must be exactly ${expectedSpec.capacity}`);
    }
    if (!isUpdate && capacity === undefined) {
      // auto-fill capacity if missing
      data.capacity = expectedSpec.capacity;
    }
    if (!isUpdate && !layoutDetails) {
      data.layoutDetails = expectedSpec.layoutDetails;
    }
  } else if (activeCategory && activeSize) {
    errors.push('Invalid category and size combination.');
  }

  if (totalBusesCount !== undefined) {
    if (typeof totalBusesCount !== 'number' || totalBusesCount < 0 || Number.isNaN(totalBusesCount)) {
      errors.push('totalBusesCount must be a non-negative number');
    }
  } else if (!isUpdate) {
    data.totalBusesCount = 0;
  }

  if (layoutDetails !== undefined && (layoutDetails === null || layoutDetails === '')) {
    errors.push('layoutDetails cannot be empty');
  }

  return errors;
};

@Injectable()
export class BusService {
  constructor(
    @InjectModel(BusModel.name)
    private readonly busModel: Model<BusModelDocument>,
  ) {}

  async getAllBusModels() {
    return await this.busModel.find().sort({ category: 1, size: 1 });
  }

  async findAll() {
    return this.getAllBusModels();
  }

  async getBusModelById(id: string) {
    return await this.busModel.findById(id);
  }

  async findOne(id: string) {
    return this.getBusModelById(id);
  }

  async createBusModel(data: CreateBusDto) {
    const errors = validateBusModelInput(data, false);
    if (errors.length > 0) {
      const err: any = new BadRequestException({ message: 'Validation failed', errors });
      err.statusCode = 400;
      err.errors = errors;
      throw err;
    }

    // Check duplicate by category & size
    const existing = await this.busModel.findOne({
      category: data.category,
      size: data.size,
    });
    if (existing) {
      const err: any = new ConflictException(
        `Bus model with category '${data.category}' and size '${data.size}' already exists.`,
      );
      err.statusCode = 409;
      throw err;
    }

    const busModel = new this.busModel(data);
    return await busModel.save();
  }

  async create(createBusDto: CreateBusDto) {
    return this.createBusModel(createBusDto);
  }

  async updateBusModel(id: string, data: UpdateBusDto) {
    const errors = validateBusModelInput(data, true);
    if (errors.length > 0) {
      const err: any = new BadRequestException({ message: 'Validation failed', errors });
      err.statusCode = 400;
      err.errors = errors;
      throw err;
    }

    const busModel = await this.busModel.findById(id);
    if (!busModel) {
      const err: any = new NotFoundException('Bus model not found');
      err.statusCode = 404;
      throw err;
    }

    // If category or size is changing, check uniqueness
    const newCategory = data.category !== undefined ? data.category : busModel.category;
    const newSize = data.size !== undefined ? data.size : busModel.size;

    if (newCategory !== busModel.category || newSize !== busModel.size) {
      const existing = await this.busModel.findOne({
        category: newCategory,
        size: newSize,
        _id: { $ne: id },
      });
      if (existing) {
        const err: any = new ConflictException(
          `Bus model with category '${newCategory}' and size '${newSize}' already exists.`,
        );
        err.statusCode = 409;
        throw err;
      }
    }

    // Update fields
    Object.assign(busModel, data);
    return await busModel.save();
  }

  async update(id: string, updateBusDto: UpdateBusDto) {
    return this.updateBusModel(id, updateBusDto);
  }

  async updateFleetCount(id: string, totalBusesCount: number) {
    if (
      typeof totalBusesCount !== 'number' ||
      totalBusesCount < 0 ||
      Number.isNaN(totalBusesCount)
    ) {
      const err: any = new BadRequestException('totalBusesCount must be a non-negative number');
      err.statusCode = 400;
      throw err;
    }

    const busModel = await this.busModel.findById(id);
    if (!busModel) {
      const err: any = new NotFoundException('Bus model not found');
      err.statusCode = 404;
      throw err;
    }

    busModel.totalBusesCount = totalBusesCount;
    return await busModel.save();
  }

  async seedBusModels() {
    const results: Array<{ action: string; model: any }> = [];
    for (const predefined of PREDEFINED_BUS_MODELS) {
      const existing = await this.busModel.findOne({
        category: predefined.category,
        size: predefined.size,
      });
      if (existing) {
        existing.capacity = predefined.capacity;
        existing.layoutDetails = predefined.layoutDetails;
        if (existing.totalBusesCount === undefined || existing.totalBusesCount === 0) {
          existing.totalBusesCount = predefined.totalBusesCount;
        }
        await existing.save();
        results.push({ action: 'updated', model: existing });
      } else {
        const newModel = new this.busModel(predefined);
        await newModel.save();
        results.push({ action: 'created', model: newModel });
      }
    }
    return results;
  }

  async seed() {
    return this.seedBusModels();
  }

  async remove(id: string) {
    const busModel = await this.busModel.findByIdAndDelete(id);
    if (!busModel) {
      const err: any = new NotFoundException('Bus model not found');
      err.statusCode = 404;
      throw err;
    }
    return busModel;
  }
}
