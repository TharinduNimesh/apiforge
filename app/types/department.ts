export interface Department {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    apiAssignments: {
        apiId: string;
        rateLimit: number;
    }[];
    userAssignments: string[];
    createdAt: string;
    createdBy: string;
}

export interface DepartmentView {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    created: string;
    updated: string;
    user_count: number;
    api_count: number;
}