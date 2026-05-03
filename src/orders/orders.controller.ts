import { Controller, Post, Body, Headers, Param, Patch, Get, Query, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from './dto/orders.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Webhook unificado que recibe pedidos de todas las plataformas
   * URL: POST /api/v1/orders/webhook/:platform
   */
  @Post('webhook/:platform')
  async receiveWebhook(
    @Param('platform') platform: string,
    @Headers() headers: Record<string, string>,
    @Body() payload: any,
  ) {
    const platformUpper = platform.toUpperCase().replace('-', '_');
    
    if (!['RAPPI', 'IFOOD', 'DOMICILIOS_COM', 'UBER_EATS'].includes(platformUpper)) {
      throw new BadRequestException(`Plataforma no soportada: ${platform}`);
    }

    return this.ordersService.processWebhook(platformUpper as any, headers, payload);
  }

  /**
   * Obtener órdenes con filtros
   */
  @Get()
  async getOrders(@Query() query: OrderQueryDto) {
    return this.ordersService.getOrders(query);
  }

  /**
   * Actualizar estado de una orden
   */
  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto);
  }

  /**
   * Obtener detalle de una orden
   */
  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }
}
