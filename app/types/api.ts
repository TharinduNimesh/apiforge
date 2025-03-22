export interface Api {
  id: string;
  name: string;
  description: string;
  type: 'FREE' | 'PAID';
  status: 'ACTIVE' | 'INACTIVE';
  endpointCount: number;
  createdAt: string;
}

export interface ApiEndpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: ApiParameter[];
  responses: ApiResponse[];
}

export interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'body';
  required: boolean;
  type: string;
  description?: string;
}

export interface ApiResponse {
  code: number;
  description: string;
  schema?: Record<string, any>;
}