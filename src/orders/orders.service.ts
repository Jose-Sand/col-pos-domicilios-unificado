import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformAdapterFactory } from './adapters/platform-adapter.factory';
import { OrderQueryDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { Platform, OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private adapterFactory: PlatformAdapterFactory,
    @InjectQueue('orders') private ordersQueue: Queue,
  ) {}

  /**
   * Procesa webhook de plataforma, normaliza y guarda orden
   */
  async processWebhook(platform: Platform, headers: Record<string, string>, payload: any) {
    this.logger.log(`Webhook recibido de ${platform}`);

    // Obtener adaptador específico de la plataforma
    const adapter = this.adapterFactory.getAdapter(platform);

    // Validar firma/autenticidad del webhook
    const isValid = await adapter.validateWebhook(headers, payload);
    if (!isValid) {
      this.logger.warn(`Webhook inválido de ${platform}`);
      return { success: false, message: 'Firma inválida' };
    }

    // Normalizar payload a estructura estándar
    const normalizedOrder = await adapter.normalizeOrder(payload);

    // Buscar restaurante por configuración de plataforma
    const config = await this.prisma.platformConfig.findFirst({
      where: {
        plataforma: platform,
        storeId: normalizedOrder.storeId,
        activo: true,
      },
      include: { restaurant: true },
    });

    if (!config) {
      this.logger.error(`No se encontró configuración para ${platform} - ${normalizedOrder.storeId}`);
      return { success: false, message: 'Restaurante no configurado' };
    }

    // Guardar orden en base de datos
    const order = await this.prisma.order.create({
      data: {
        restaurantId: config.restaurantId,
        plataforma: platform,
        externalId: normalizedOrder.externalId,
        numeroOrden: normalizedOrder.numeroOrden,
        estado: OrderStatus.RECEIVED,
        subtotal: normalizedOrder.subtotal,
        propina: normalizedOrder.propina,
        domicilio: normalizedOrder.domicilio,
        total: normalizedOrder.total,
        metodoPago: normalizedOrder.metodoPago,
        clienteNombre: normalizedOrder.clienteNombre,
        clienteTelefono: normalizedOrder.clienteTelefono,
        direccionEntrega: normalizedOrder.direccionEntrega,
        ciudad: normalizedOrder.ciudad,
        instrucciones: normalizedOrder.instrucciones,
        rawPayload: payload,
        items: {
          create: normalizedOrder.items.map((item) => ({
            nombre: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
            instrucciones: item.instrucciones,
          })),
        },
      },
      include: { items: true },
    });

    // Encolar actualización de inventario
    await this.ordersQueue.add('update-inventory', {
      orderId: order.id,
      items: normalizedOrder.items,
    });

    this.logger.log(`Orden ${order.numeroOrden} creada exitosamente`);

    return { success: true, orderId: order.id, numeroOrden: order.numeroOrden };
  }

  /**
   * Obtener órdenes con filtros
   */
  async getOrders(query: OrderQueryDto) {
    const { restaurantId, estado, plataforma, desde, hasta, page = 1, limit = 50 } = query;

    const where: any = {};
    if (restaurantId) where.restaurantId = restaurantId;
    if (estado) where.estado = estado;
    if (plataforma) where.plataforma = plataforma;
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Actualizar estado de orden y sincronizar con plataforma
   */
  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { estado: dto.estado },
    });

    // Sincronizar estado con la plataforma original
    const adapter = this.adapterFactory.getAdapter(order.plataforma);
    await adapter.updateOrderStatus(order.externalId, dto.estado);

    this.logger.log(`Orden ${order.numeroOrden} actualizada a ${dto.estado}`);

    return updatedOrder;
  }

  /**
   * Obtener detalle de orden por ID
   */
  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, restaurant: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }
}
