export interface Api {
  id: string;
  name: string;
  description: string;
  type: 'FREE' | 'PAID';
  status: 'ACTIVE' | 'INACTIVE';
  rateLimit: number;
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
  type: string;
  param_in: 'query' | 'path' | 'header' | 'body' | 'formData';
  description: string;
  required: boolean;
  fileConfig?: {
    multiple?: boolean;
  };
};

export interface ApiResponse {
  code: number;
  description: string;
  schema?: Record<string, any>;
}

export interface ApiOption {
  id: string;
  name: string;
  type: 'FREE' | 'PAID';
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  endpoint?: string;
}