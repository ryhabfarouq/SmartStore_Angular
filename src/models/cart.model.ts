export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  addedAt: string;
  product?: {
    title: string;
    thumbnail: string;
    price: number;
    discountPercentage: number;
    stock: number;
  };
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  itemCount: number;
}
