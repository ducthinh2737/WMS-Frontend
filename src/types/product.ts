export type ProductType = 0 | 1;


export const PRODUCT_TYPE_OPTIONS = [
    { label: "Nguyên vật liệu", value: 0 as ProductType },
    { label: "Thành phẩm", value: 1 as ProductType },
];

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
    0: "Nguyên vật liệu",
    1: "Thành phẩm",
};
export interface ProductTypeDto {
    type: ProductType;
}


export interface Product {
    id: number;
    code: string;
    name: string;
    description?: string;
    type: ProductType;
    categoryId: number;
    unitId: number;
    brandId: number;
    supplierId: number;
    isActive: boolean;
    createdAt: string;
}

export interface CreateProductDto {
    code: string;
    name: string;
    description?: string;
    type: ProductType;
    categoryId: number;
    unitId: number;
    brandId: number;
    supplierId: number;
}

export interface UpdateProductDto {
    code: string;
    name: string;
    description?: string;
    type: ProductType;
    categoryId: number;
    unitId: number;
    brandId: number;
    supplierId: number;
    isActive: boolean;
}


export interface ProductFilterDto {
    keyword?: string;
    categoryId?: number;
    brandId?: number;
    supplierId?: number;
    page: number;
    pageSize: number;
}

// src/types/product.ts
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

