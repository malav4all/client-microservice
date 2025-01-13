import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from './client.schema';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientService {
  // Hard-coded secret for demo; in production, use process.env.JWT_SECRET
  private readonly JWT_SECRET = 'MY_SUPER_SECRET';
  private readonly EXPIRES_IN = '5m';
  constructor(
    @InjectModel(Client.name)
    private readonly clientModel: Model<Client>
  ) {}

  async createUser(dto: CreateClientDto): Promise<Client> {
    // Ensure email is unique
    const existing = await this.clientModel
      .findOne({ email: dto.email })
      .exec();
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // If no apiKey was provided, generate one
    let apiKey = dto.apiKey;
    if (!apiKey) {
      apiKey = this.generateApiKey();
    }

    // Convert apiKeyExpiresAt string to Date if provided
    let apiKeyExpiresAt = null;
    if (dto.apiKeyExpiresAt) {
      apiKeyExpiresAt = new Date(dto.apiKeyExpiresAt);
    }

    // Hash the password
    const saltRounds = 10; // Adjust the cost factor based on security requirements
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = new this.clientModel({
      name: dto.name,
      email: dto.email,
      password: hashedPassword, // Store the hashed password
      apiKey,
      apiKeyExpiresAt,
      roles: dto.roles || [],
      permissionMatrix: dto.permissionMatrix || {},
      usageCounters: dto.usageCounters || {},
    });

    return user.save();
  }

  // Generate a random API key
  private generateApiKey(): string {
    const rand = crypto.randomBytes(20).toString('hex').toUpperCase();
    return `${rand}`;
  }

  /**
   * Return all users (demo).
   * In production, you might want to remove passwords or filter data.
   */
  async findAll(): Promise<Client[]> {
    return this.clientModel.find().exec();
  }

  async findById(id: string) {
    const user = await this.clientModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(
    id: string,
    updateDto: { name?: string; email?: string; age?: number }
  ) {
    const user = await this.clientModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found or update failed');
    }
    return user;
  }

  async deleteUser(id: string) {
    const result = await this.clientModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found or delete failed');
    }
    return result;
  }

  async findByUsername(email: string): Promise<Client | null> {
    return this.clientModel.findOne({ email }).exec();
  }

  async validateUser(username: string, password: string) {
    const user = await this.findByUsername(username); // Replace with your actual user lookup method
    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    // Compare the hashed password with the plaintext password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    return user; // Return the user if validation is successful
  }

  // Generate a JWT for the authenticated user
  async generateToken(user: any) {
    // user could have _id, username, roles, etc.
    const payload = {
      userId: user._id,
      username: user.username,
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.EXPIRES_IN });
  }

  async findApiKey(apiKey: string): Promise<Client | null> {
    const user = await this.clientModel.findOne({ apiKey }).exec();
    if (!user) {
      throw new NotFoundException('User with the provided API key not found');
    }
    return user;
  }

  async updateUserUsage(
    userId: string,
    data: {
      usageCounters: Record<string, number>;
      permissionMatrix?: Record<string, any>;
    }
  ): Promise<Client> {
    const user = await this.clientModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update usage counters
    user.usageCounters = {
      ...user.usageCounters, // Preserve existing usageCounters
      ...data.usageCounters, // Merge with incoming updates
    };

    // Update permissionMatrix (if provided)
    if (data.permissionMatrix) {
      user.permissionMatrix = {
        ...user.permissionMatrix, // Preserve existing matrix
        ...data.permissionMatrix, // Merge with incoming updates
      };
    }

    return user.save(); // Persist changes to the database
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<Client> {
    const user = await this.clientModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    const saltRounds = 10;
    user.password = await bcrypt.hash(newPassword, saltRounds);

    return user.save();
  }
}
