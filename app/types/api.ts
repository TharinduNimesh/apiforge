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
  param_in: 'body' | 'header' | 'path' | 'query' | 'formData';
  required: boolean;
  description: string;
  file_options?: string; // Raw file options string from the server
  fileConfig?: {
    multiple: boolean;
    maxSize: number;
    accept: string[] | string;
  };
}

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