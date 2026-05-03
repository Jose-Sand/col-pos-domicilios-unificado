import { OrderStatus } from '@prisma/client';
import { NormalizedOrder } from '../dto/orders.dto';

/**
 * Interface que deben implementar todos los adaptadores de plataforma
 */
export interface IPlatformAdapter {
  /**
   * Valida la autenticidad del webhook usando firma/headers
   */
  validateWebhook(headers: Record<string, string>, payload: any): Promise<boolean>;

  /**
   * Normaliza el payload de la plataforma a estructura estándar
   */
  normalizeOrder(payload: any): Promise<NormalizedOrder>;

  /**
   * Actualiza estado de orden en la plataforma
   */
  updateOrderStatus(externalId: string, status: OrderStatus): Promise<void>;

  /**
   * Actualiza disponibilidad de producto en la plataforma
   */
  updateProductAvailability(externalId: string, available: boolean): Promise<void>;

  /**
   * Actualiza stock de producto en la plataforma
   */
  updateProductStock(externalId: string, stock: number): Promise<void>;
}
