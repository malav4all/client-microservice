import {
  Body,
  ConflictException,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { Client } from './client.schema';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  // CREATE
  @Post()
  async create(
    @Body() createClientDto: CreateClientDto
  ): Promise<{ message: string }> {
    try {
      await this.clientService.createUser(createClientDto);

      // Return success message and created client
      return {
        message: 'Client created successfully',
      };
    } catch (error) {
      // Handle known errors (e.g., duplicate key errors)
      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new ConflictException(
          'Client with the provided details already exists'
        );
      }

      // Handle unexpected errors
      throw new InternalServerErrorException(
        'An error occurred while creating the client'
      );
    }
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ): Promise<
    | { data: any; total: number; page: number; limit: number }
    | { error: string }
  > {
    try {
      const pageNumber = Number(page);
      const limitNumber = Number(limit);

      if (isNaN(pageNumber) || pageNumber < 1) {
        throw new Error(
          'Invalid page number. Page must be a positive integer.'
        );
      }
      if (isNaN(limitNumber) || limitNumber < 1) {
        throw new Error(
          'Invalid limit number. Limit must be a positive integer.'
        );
      }

      return await this.clientService.findAll(pageNumber, limitNumber);
    } catch (error) {
      return {
        error:
          error.message ||
          'An error occurred while fetching products. Please try again later.',
      };
    }
  }

  @Post('login')
  async login(@Body() creds: { email: string; password: string }): Promise<{
    message: string;
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      roles: string[];
      permissionMatrix: any;
      apiKey: string;
      apiKeyExpiresAt: any;
    };
  }> {
    try {
      // Validate user credentials
      const user = await this.clientService.validateUser(
        creds.email,
        creds.password
      );

      // Generate JWT token
      const token = await this.clientService.generateToken(user);

      // Structure the user object excluding sensitive fields
      const {
        _id,
        name,
        email,
        roles,
        permissionMatrix,
        apiKey,
        apiKeyExpiresAt,
      } = user;
      const userDetails = {
        id: _id as string, // Ensure _id is a string
        name,
        email,
        roles,
        permissionMatrix,
        apiKey,
        apiKeyExpiresAt,
      };

      // Return success response
      return {
        message: `Welcome ${name}`,
        accessToken: token,
        user: userDetails,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Handle unexpected errors
      throw new InternalServerErrorException(
        'An error occurred while processing the login request'
      );
    }
  }

  @Get('find-by-api-key/:apiKey')
  async findByApiKey(@Param('apiKey') apiKey: string) {
    const user = await this.clientService.findApiKey(apiKey);
    return user;
  }

  @Put('update-usage/:id')
  async updateUserUsage(
    @Param('id') id: string,
    @Body()
    data: {
      usageCounters: Record<string, number>;
      permissionMatrix?: Record<string, any>; // Optional permissionMatrix updates
    }
  ) {
    return this.clientService.updateUserUsage(id, data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() userData: Partial<Client>
  ): Promise<{ message: string }> {
    try {
      const updatedUser = await this.clientService.updateUser(id, userData);

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return {
        message: `User ${updatedUser.name} updated successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Handle unexpected errors
      throw new InternalServerErrorException(
        'An error occurred while updating the user'
      );
    }
  }

  @Patch('change-password/:id')
  async changePassword(
    @Param('id') id: string,
    @Body() creds: { oldPassword: string; newPassword: string }
  ) {
    try {
      const { oldPassword, newPassword } = creds;
      await this.clientService.changePassword(id, oldPassword, newPassword);
      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      throw error;
    }
  }
}
