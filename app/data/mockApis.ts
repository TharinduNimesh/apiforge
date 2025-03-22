import type { Api } from '~/types/api';

export const mockApis: Api[] = [
  {
    id: '1',
    name: 'Weather API',
    description: 'Get real-time weather data for any location worldwide. Includes current conditions, forecasts, and historical data.',
    type: 'FREE',
    status: 'ACTIVE',
    endpointCount: 5,
    createdAt: '2025-03-20T10:00:00Z'
  },
  {
    id: '2',
    name: 'Currency Exchange API',
    description: 'Live currency exchange rates and conversions for 170+ currencies. Historical rates and forex data included.',
    type: 'PAID',
    status: 'ACTIVE',
    endpointCount: 8,
    createdAt: '2025-03-21T09:30:00Z'
  },
  {
    id: '3',
    name: 'News Feed API',
    description: 'Access to global news articles from 50,000+ sources. Includes real-time updates and content categorization.',
    type: 'PAID',
    status: 'ACTIVE',
    endpointCount: 12,
    createdAt: '2025-03-21T14:15:00Z'
  },
  {
    id: '4',
    name: 'Stock Market API',
    description: 'Real-time and historical stock market data. Includes price quotes, company info, and market indicators.',
    type: 'PAID',
    status: 'INACTIVE',
    endpointCount: 15,
    createdAt: '2025-03-19T11:20:00Z'
  },
  {
    id: '5',
    name: 'Image Recognition API',
    description: 'AI-powered image recognition and classification. Detect objects, faces, text, and more in images.',
    type: 'FREE',
    status: 'ACTIVE',
    endpointCount: 6,
    createdAt: '2025-03-22T08:45:00Z'
  },
  {
    id: '6',
    name: 'Translation API',
    description: 'Neural machine translation supporting 100+ languages. Auto-detection and batch translation included.',
    type: 'FREE',
    status: 'INACTIVE',
    endpointCount: 4,
    createdAt: '2025-03-18T16:30:00Z'
  },
  {
    id: '7',
    name: 'Social Media Analytics API',
    description: 'Track and analyze social media metrics across platforms. Includes engagement stats and trend analysis.',
    type: 'PAID',
    status: 'ACTIVE',
    endpointCount: 10,
    createdAt: '2025-03-20T13:25:00Z'
  },
  {
    id: '8',
    name: 'PDF Processing API',
    description: 'Convert, merge, split, and extract data from PDF files. OCR and document analysis included.',
    type: 'FREE',
    status: 'ACTIVE',
    endpointCount: 7,
    createdAt: '2025-03-19T15:10:00Z'
  }
];