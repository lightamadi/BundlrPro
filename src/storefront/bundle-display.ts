interface BundleProduct {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  products: BundleProduct[];
  discountRule: {
    type: 'percentage' | 'fixed' | 'bxgy' | 'tiered';
    value: number;
    minQuantity?: number;
    freeQuantity?: number;
    tiers?: Array<{
      quantity: number;
      discount: number;
    }>;
  };
}

class BundleDisplay {
  private bundle: Bundle;
  private container: HTMLElement;

  constructor(bundle: Bundle, containerId: string) {
    this.bundle = bundle;
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id ${containerId} not found`);
    }
    this.container = container;
  }

  private calculateBundlePrice(): number {
    const totalPrice = this.bundle.products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );

    switch (this.bundle.discountRule.type) {
      case 'percentage':
        return totalPrice * (1 - this.bundle.discountRule.value / 100);
      
      case 'fixed':
        return this.bundle.discountRule.value;
      
      case 'bxgy':
        if (this.bundle.discountRule.minQuantity && this.bundle.discountRule.freeQuantity) {
          const totalQuantity = this.bundle.products.reduce(
            (sum, product) => sum + product.quantity,
            0
          );
          const freeItems = Math.floor(totalQuantity / this.bundle.discountRule.minQuantity) *
            this.bundle.discountRule.freeQuantity;
          return totalPrice * ((totalQuantity - freeItems) / totalQuantity);
        }
        return totalPrice;
      
      case 'tiered':
        if (this.bundle.discountRule.tiers) {
          const totalQuantity = this.bundle.products.reduce(
            (sum, product) => sum + product.quantity,
            0
          );
          const applicableTier = this.bundle.discountRule.tiers
            .sort((a, b) => b.quantity - a.quantity)
            .find(tier => totalQuantity >= tier.quantity);
          
          if (applicableTier) {
            return totalPrice * (1 - applicableTier.discount / 100);
          }
        }
        return totalPrice;
      
      default:
        return totalPrice;
    }
  }

  private formatPrice(price: number): string {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  }

  public render(): void {
    const originalPrice = this.bundle.products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );
    const discountedPrice = this.calculateBundlePrice();
    const savings = originalPrice - discountedPrice;

    const template = `
      <div class="bundlr-pro-bundle">
        <h2 class="bundle-title">${this.bundle.name}</h2>
        <p class="bundle-description">${this.bundle.description}</p>
        
        <div class="bundle-products">
          ${this.bundle.products
            .map(
              product => `
                <div class="bundle-product">
                  <span class="product-quantity">${product.quantity}x</span>
                  <span class="product-id">${product.productId}</span>
                </div>
              `
            )
            .join('')}
        </div>

        <div class="bundle-pricing">
          <div class="original-price">
            <span class="price-label">Original Price:</span>
            <span class="price-value">${this.formatPrice(originalPrice)}</span>
          </div>
          <div class="discounted-price">
            <span class="price-label">Bundle Price:</span>
            <span class="price-value">${this.formatPrice(discountedPrice)}</span>
          </div>
          <div class="savings">
            <span class="price-label">You Save:</span>
            <span class="price-value">${this.formatPrice(savings)}</span>
          </div>
        </div>

        <button class="add-bundle-to-cart" data-bundle-id="${this.bundle.id}">
          Add Bundle to Cart
        </button>
      </div>
    `;

    this.container.innerHTML = template;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const addToCartButton = this.container.querySelector('.add-bundle-to-cart');
    if (addToCartButton) {
      addToCartButton.addEventListener('click', () => this.handleAddToCart());
    }
  }

  private async handleAddToCart(): Promise<void> {
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: this.bundle.products.map(product => ({
            id: product.variantId,
            quantity: product.quantity,
            properties: {
              '_bundle_id': this.bundle.id,
              '_bundle_name': this.bundle.name
            }
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add bundle to cart');
      }

      // Refresh mini-cart or show success message
      const cartUpdateEvent = new CustomEvent('bundlr-pro:cart-updated');
      window.dispatchEvent(cartUpdateEvent);
    } catch (error) {
      console.error('Error adding bundle to cart:', error);
      // Show error message to user
    }
  }
}

export default BundleDisplay; 