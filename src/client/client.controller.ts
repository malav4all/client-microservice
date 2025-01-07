import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ClientService } from './client.service';
import { Client } from './client.schema';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  // CREATE
  @Post()
  // @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createClientDto: CreateClientDto): Promise<Client> {
    const user = await this.clientService.createUser(createClientDto);
    return user;
  }

  // READ ALL
  @Get()
  async findAll() {
    return this.clientService.findAll();
  }

  @Post('login')
  async login(@Body() creds: { email: string; password: string }) {
    // Validate user (check DB)
    const user = await this.clientService.validateUser(
      creds.email,
      creds.password
    );
    // Generate JWT
    const token = await this.clientService.generateToken(user);
    return { accessToken: token };
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
}
