import { H3Event, H3Error } from 'h3'
import { getAdminPocketBase, getUserPocketBase } from '../utils/pocketbase'

interface BaseRecord {
  id: string
  created: string
  updated: string
  collectionId: string
  collectionName: string
}

interface ApiRecord extends BaseRecord {
  name: string
  description: string
  baseUrl: string
  isActive: boolean
  type: string
  createdBy: string
  rateLimit: number
}

interface EndpointRecord extends BaseRecord {
  name: string
  description: string
  path: string
  method: string
  api: string
}

interface ParameterRecord extends BaseRecord {
  name: string;
  description: string;
  type: string;
  param_in: string;
  required: boolean;
  endpoint: string;
  file_options?: string;
}

interface Department extends BaseRecord {
  is_active: boolean
}

interface ApiResponse {
  id: string
  name: string
  description: string
  baseUrl: string
  isActive: boolean
  type: string
  createdBy: string
  createdAt: string
  rateLimit: number
  endpoints: EndpointWithParams[]
}

interface EndpointWithParams {
  id: string;
  name: string;
  description: string;
  path: string;
  method: string;
  api: string;
  parameters: Array<{
    name: string;
    description: string;
    type: string;
    param_in: string;
    required: boolean;
    file_options?: string;
  }>;
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'API ID is required'
      })
    }

    const authHeader = getHeader(event, 'authorization')
    if (!authHeader) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - No token provided'
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const adminPb = getAdminPocketBase()
    const userPb = await getUserPocketBase(token)

    try {
      if (!userPb.authStore.isValid) {
        throw new Error('Invalid token')
      }
    } catch (error) {
      throw createError({
        statusCode: 401,
        message: 'Invalid token'
      })
    }

    const userId = userPb.authStore.record?.id
    const isAdmin = userPb.authStore.record?.role === 'admin'

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'User ID not found'
      })
    }

    try {
      const apiRecord = await adminPb.collection('apis').getOne<ApiRecord>(id)
      
      if (!isAdmin && !apiRecord.isActive) {
        throw createError({
          statusCode: 403,
          message: 'This API is currently inactive'
        })
      }

      // Extract the API fields we need
      const api: Omit<ApiResponse, 'endpoints'> = {
        id: apiRecord.id,
        name: apiRecord.name,
        description: apiRecord.description,
        baseUrl: apiRecord.baseUrl,
        isActive: apiRecord.isActive,
        type: apiRecord.type,
        createdBy: apiRecord.createdBy,
        createdAt: apiRecord.created,
        rateLimit: apiRecord.rateLimit
      }

      // For non-admin users, check department access
      if (!isAdmin) {
        const departments = await adminPb.collection('departments').getFullList<Department>()
        const activeDepartments = departments.filter(d => d.is_active === true)

        const departmentUsers = await adminPb.collection('department_users').getFullList<{ 
          user_id: string
          department_id: string 
        }>({
          filter: `user_id = "${userId}"`
        })

        if (departmentUsers.length === 0) {
          throw createError({
            statusCode: 403,
            message: 'Access denied - No department membership'
          })
        }

        const activeDepartmentIds = departmentUsers
          .filter(du => activeDepartments.some(d => d.id === du.department_id))
          .map(du => du.department_id)

        if (activeDepartmentIds.length === 0) {
          throw createError({
            statusCode: 403,
            message: 'Access denied - No active department membership'
          })
        }

        const filter = activeDepartmentIds.map(dId => `department_id = "${dId}"`).join(' || ')
        const departmentApis = await adminPb.collection('department_apis').getFullList<{
          api_id: string
        }>({
          filter
        })

        if (!departmentApis.some(da => da.api_id === id)) {
          throw createError({
            statusCode: 403,
            message: 'Access denied to this API'
          })
        }
      }

      const endpoints = await adminPb.collection('endpoints').getFullList<EndpointRecord>({
        filter: `api = "${id}"`,
        sort: 'name'
      })

      const endpointIds = endpoints.map(endpoint => endpoint.id)
      let parameters: ParameterRecord[] = []
      
      if (endpointIds.length > 0) {
        const paramFilter = endpointIds.map(eid => `endpoint = "${eid}"`).join(' || ')
        parameters = await adminPb.collection('parameters').getFullList<ParameterRecord>({
          filter: paramFilter
        })
      }

      const endpointsWithParams: EndpointWithParams[] = endpoints.map(endpoint => ({
        id: endpoint.id,
        name: endpoint.name,
        description: endpoint.description,
        path: endpoint.path,
        method: endpoint.method,
        api: endpoint.api,
        parameters: parameters
          .filter(param => param.endpoint === endpoint.id)
          .map(({ endpoint, ...param }) => param)
      }))

      const response: ApiResponse = {
        ...api,
        endpoints: endpointsWithParams
      }

      return response

    } catch (error: any) {
      if (error.status === 404) {
        throw createError({
          statusCode: 404,
          message: 'API not found'
        })
      }
      throw error
    }
  } catch (error) {
    const h3Error = error as H3Error
    console.error('Error in [id].get.ts:', h3Error)
    throw createError({
      statusCode: h3Error.statusCode || 500,
      message: h3Error.message || 'Internal Server Error'
    })
  }
})