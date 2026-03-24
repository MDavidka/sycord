/**
 * Shared TypeScript interfaces and types for the modern phone brand e-commerce site.
 */

export interface PhoneSpecs {
    screen: string;
    processor: string;
    ram: string;
    storage: string;
    battery: string;
    camera: string;
}

export interface Product {
    id: string;
    name: string;
    tagline?: string;
    description: string;
    price: number;
    imageUrl: string;
    category: 'phone' | 'accessory' | 'wearable';
    isFlagship?: boolean;
    specs?: PhoneSpecs;
    colors: { name: string; hex: string }[];
}

export interface CartItem {
    product: Product;
    quantity: number;
    selectedColor: { name: string; hex: string };
}

export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}

export interface SiteConfig {
    brandName: string;
    supportEmail: string;
    socialLinks: {
        twitter: string;
        instagram: string;
        facebook: string;
    };
}

export interface NavItem {
    label: string;
    href: string;
    isButton?: boolean;
}

export interface ComponentProps {
    container: HTMLElement;
}

export interface ProductCardProps extends ComponentProps {
    product: Product;
    onAddToCart: (product: Product, color: { name: string; hex: string }) => void;
}

export interface CartDrawerProps extends ComponentProps {
    isOpen: boolean;
    onClose: () => void;
}