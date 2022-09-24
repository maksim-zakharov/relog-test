export enum OrderType {
  Pickup = 'pickup',
  Delivery = 'delivery'
}

export const OrderTypeNames = {
  [OrderType.Pickup]: 'Забор',
  [OrderType.Delivery]: 'Доставка',
}

export interface Client {
  id: number,
  name: string;
  phone: string;
}

export interface Order {
  id: number,
  type: OrderType,
  price: number,
  coords: { lat: number, long: number },
  client_id: number
}

export interface OrderViewItem extends Order {
  client: Client;
}
