interface CartItem {
  id: number;
  quantity: number;
  price: number;
  properties: {
    _bundle_id?: string;
    _bundle_name?: string;
  };
}

interface BundleDiscount {
  type: 'percentage' | 'fixed' | 'bxgy' | 'tiered';
  value: number;
  minQuantity?: number;
  freeQuantity?: number;
  tiers?: Array<{
    quantity: number;
    discount: number;
  }>;
}

class CartCalculator {
  private cart: CartItem[];
  private bundles: Map<string, BundleDiscount>;

  constructor(cart: CartItem[], bundles: Map<string, BundleDiscount>) {
    this.cart = cart;
    this.bundles = bundles;
  }

  public calculateDiscounts(): { 
    items: Array<{ id: number; discountedPrice: number }>;
    totalDiscount: number;
  } {
    const bundleGroups = this.groupItemsByBundle();
    let totalDiscount = 0;
    const discountedItems: Array<{ id: number; discountedPrice: number }> = [];

    for (const [bundleId, items] of bundleGroups) {
      const bundleDiscount = this.bundles.get(bundleId);
      if (!bundleDiscount) continue;

      const { itemDiscounts, bundleDiscount: discount } = this.calculateBundleDiscount(
        items,
        bundleDiscount
      );

      totalDiscount += discount;
      discountedItems.push(...itemDiscounts);
    }

    return {
      items: discountedItems,
      totalDiscount
    };
  }

  private groupItemsByBundle(): Map<string, CartItem[]> {
    const groups = new Map<string, CartItem[]>();

    for (const item of this.cart) {
      const bundleId = item.properties._bundle_id;
      if (!bundleId) continue;

      if (!groups.has(bundleId)) {
        groups.set(bundleId, []);
      }
      groups.get(bundleId)?.push(item);
    }

    return groups;
  }

  private calculateBundleDiscount(
    items: CartItem[],
    discount: BundleDiscount
  ): {
    itemDiscounts: Array<{ id: number; discountedPrice: number }>;
    bundleDiscount: number;
  } {
    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalQuantity = items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    let discountedTotal = totalPrice;
    switch (discount.type) {
      case 'percentage':
        discountedTotal = totalPrice * (1 - discount.value / 100);
        break;

      case 'fixed':
        discountedTotal = discount.value;
        break;

      case 'bxgy':
        if (discount.minQuantity && discount.freeQuantity) {
          const freeItems = Math.floor(totalQuantity / discount.minQuantity) *
            discount.freeQuantity;
          discountedTotal = totalPrice * ((totalQuantity - freeItems) / totalQuantity);
        }
        break;

      case 'tiered':
        if (discount.tiers) {
          const applicableTier = discount.tiers
            .sort((a, b) => b.quantity - a.quantity)
            .find(tier => totalQuantity >= tier.quantity);
          
          if (applicableTier) {
            discountedTotal = totalPrice * (1 - applicableTier.discount / 100);
          }
        }
        break;
    }

    const discountRatio = discountedTotal / totalPrice;
    const itemDiscounts = items.map(item => ({
      id: item.id,
      discountedPrice: item.price * discountRatio
    }));

    return {
      itemDiscounts,
      bundleDiscount: totalPrice - discountedTotal
    };
  }

  public async applyDiscounts(): Promise<void> {
    const { items, totalDiscount } = this.calculateDiscounts();

    try {
      // Update cart using Shopify Cart API
      await fetch('/cart/update.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: items.reduce((acc, item) => ({
            ...acc,
            [item.id]: item.discountedPrice
          }), {})
        })
      });

      // Dispatch event for cart updates
      const cartUpdateEvent = new CustomEvent('bundlr-pro:cart-updated', {
        detail: { totalDiscount }
      });
      window.dispatchEvent(cartUpdateEvent);
    } catch (error) {
      console.error('Error updating cart prices:', error);
      throw error;
    }
  }
}

export default CartCalculator; 