import type { Department } from '~/types/department';

export const mockDepartments: Department[] = [
    {
        id: '1',
        name: 'Engineering',
        description: 'Software development and infrastructure team',
        isActive: true,
        apiAssignments: [
            { apiId: '1', rateLimit: 1000 },
            { apiId: '2', rateLimit: 500 }
        ],
        userAssignments: ['1', '3'],
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: '1'
    },
    {
        id: '2',
        name: 'Marketing',
        description: 'Digital marketing and brand management',
        isActive: true,
        apiAssignments: [
            { apiId: '3', rateLimit: 200 }
        ],
        userAssignments: ['2'],
        createdAt: '2025-01-15T00:00:00Z',
        createdBy: '1'
    },
    {
        id: '3',
        name: 'Sales',
        description: 'Sales and customer relations',
        isActive: false,
        apiAssignments: [],
        userAssignments: ['4', '5'],
        createdAt: '2025-02-01T00:00:00Z',
        createdBy: '4'
    },
    {
        id: '4',
        name: 'Research',
        description: 'Market research and analysis',
        isActive: true,
        apiAssignments: [
            { apiId: '2', rateLimit: 300 },
            { apiId: '3', rateLimit: 400 }
        ],
        userAssignments: ['2', '5'],
        createdAt: '2025-02-15T00:00:00Z',
        createdBy: '4'
    }
];