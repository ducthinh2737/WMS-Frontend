export interface LocationDto {
    id: string;                 // Guid
    warehouseId: string;
    code: string;               // ví dụ: A1-01-03
    description?: string;
    isActive: boolean;
    createdAt: string;
    Type: string;
    updatedAt?: string;
}

export interface LocationCreateDto {
    warehouseId: string;
    type: string;
    code: string;
    description?: string | null;
}


export interface LocationUpdateDto {
    id: string;
    code?: string | null;
    LocationType?: number | null;
    description?: string | null;
    isActive?: boolean | null;
}
