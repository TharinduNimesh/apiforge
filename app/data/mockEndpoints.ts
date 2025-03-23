import type { ApiEndpoint } from '~/types/api';

export const mockEndpoints: Record<string, ApiEndpoint[]> = {
  // Weather API endpoints (id: '1')
  '1': [
    {
      id: 'w1',
      name: 'Current Weather',
      path: '/v1/current',
      method: 'GET',
      description: 'Get current weather conditions for a specific location',
      parameters: [
        {
          name: 'lat',
          in: 'query',
          required: true,
          type: 'number',
          description: 'Latitude of the location'
        },
        {
          name: 'lon',
          in: 'query',
          required: true,
          type: 'number',
          description: 'Longitude of the location'
        }
      ],
      responses: [
        {
          code: 200,
          description: 'Successful response with current weather data',
          schema: {
            temperature: 'number',
            humidity: 'number',
            wind_speed: 'number',
            conditions: 'string'
          }
        }
      ]
    },
    {
      id: 'w2',
      name: 'Forecast',
      path: '/v1/forecast',
      method: 'GET',
      description: '5-day weather forecast for a specific location',
      parameters: [
        {
          name: 'lat',
          in: 'query',
          required: true,
          type: 'number',
          description: 'Latitude of the location'
        },
        {
          name: 'lon',
          in: 'query',
          required: true,
          type: 'number',
          description: 'Longitude of the location'
        },
        {
          name: 'days',
          in: 'query',
          required: false,
          type: 'number',
          description: 'Number of days (1-5)'
        }
      ],
      responses: [
        {
          code: 200,
          description: 'Successful response with forecast data'
        }
      ]
    }
  ],

  // Currency Exchange API endpoints (id: '2')
  '2': [
    {
      id: 'c1',
      name: 'Latest Rates',
      path: '/v1/latest',
      method: 'GET',
      description: 'Get latest exchange rates for all supported currencies',
      parameters: [
        {
          name: 'base',
          in: 'query',
          required: false,
          type: 'string',
          description: 'Base currency (default: USD)'
        }
      ],
      responses: [
        {
          code: 200,
          description: 'Latest exchange rates'
        }
      ]
    },
    {
      id: 'c2',
      name: 'Convert Currency',
      path: '/v1/convert',
      method: 'GET',
      description: 'Convert amount from one currency to another',
      parameters: [
        {
          name: 'from',
          in: 'query',
          required: true,
          type: 'string',
          description: 'Source currency code'
        },
        {
          name: 'to',
          in: 'query',
          required: true,
          type: 'string',
          description: 'Target currency code'
        },
        {
          name: 'amount',
          in: 'query',
          required: true,
          type: 'number',
          description: 'Amount to convert'
        }
      ],
      responses: [
        {
          code: 200,
          description: 'Converted amount'
        }
      ]
    }
  ],

  // News Feed API endpoints (id: '3')
  '3': [
    {
      id: 'n1',
      name: 'Latest News',
      path: '/v1/news',
      method: 'GET',
      description: 'Get latest news articles with optional filtering',
      parameters: [
        {
          name: 'category',
          in: 'query',
          required: false,
          type: 'string',
          description: 'News category (e.g., technology, sports)'
        },
        {
          name: 'language',
          in: 'query',
          required: false,
          type: 'string',
          description: 'Article language (e.g., en, es)'
        }
      ],
      responses: [
        {
          code: 200,
          description: 'List of news articles'
        }
      ]
    },
    {
      id: 'n2',
      name: 'Search News',
      path: '/v1/news/search',
      method: 'GET',
      description: 'Search news articles by keyword',
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          type: 'string',
          description: 'Search query'
        },
        {
          name: 'from',
          in: 'query',
          required: false,
          type: 'string',
          description: 'Start date (YYYY-MM-DD)'
        },
        {
          name: 'to',
          in: 'query',
          required: false,
          type: 'string',
          description: 'End date (YYYY-MM-DD)'
        }
      ],
      responses: [
        {
          code: 200,
          description: 'Search results'
        }
      ]
    }
  ]
};