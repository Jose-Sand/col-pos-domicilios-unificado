import { IsEnum, IsString, IsOptional, IsInt, Min, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, Platform } from '@prisma/client';

export class CreateOrderDto {
  @IsString()
  restaurantId: string;

  @IsEnum(Platform)
  plataforma: Platform;

  @IsString()
  externalId: string;

  @IsInt()
  @Min(0)
  total: number;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  estado: OrderStatus;
}

export class OrderQueryDto {
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  estado?: OrderStatus;

  @IsOptional()
  @IsEnum(Platform)
  plataforma?: Platform;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}

export interface NormalizedOrder {
  storeId: string;
  externalId: string;
  numeroOrden: string;
  subtotal: number;
  propina: number;
  domicilio: number;
  total: number;
  metodoPago: string;
  clienteNombre: string;
  clienteTelefono: string;
  direccionEntrega: string;
  ciudad: string;
  instrucciones?: string;
  items: NormalizedOrderItem[];
}

export interface NormalizedOrderItem {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  instrucciones?: string;
}
