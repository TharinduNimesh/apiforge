import type { User } from '~/types/user';

export const mockUsers: User[] = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        createdAt: '2025-01-15T08:00:00Z'
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'user',
        createdAt: '2025-02-01T09:30:00Z'
    },
    {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        role: 'user',
        createdAt: '2025-02-15T14:20:00Z'
    },
    {
        id: '4',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        role: 'admin',
        createdAt: '2025-03-01T11:45:00Z'
    },
    {
        id: '5',
        name: 'David Brown',
        email: 'david.brown@example.com',
        role: 'user',
        createdAt: '2025-03-10T16:15:00Z'
    }
];