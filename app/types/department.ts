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