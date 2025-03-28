import { H3Event } from 'h3'
import { getAdminPocketBase, getUserPocketBase } from '../utils/pocketbase'

interface ApiRecord {
  id: string
  name: string
  description: string
  baseUrl: string
  isActive: boolean
  type: string
  createdBy: string
  rateLimit: string
}

interface EndpointRecord {
  id: string
  name: string
  description: string
  path: string
  method: string
  api: string
}

interface ParameterRecord {
  id: string
  name: string
  description: string
  type: string
  param_in: string
  required: boolean
  endpoint: string
}

interface EndpointWithParams extends EndpointRecord {
  parameters: ParameterRecord[]
}

interface ApiResponse extends ApiRecord {
  endpoints: EndpointWithParams[]
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

    // Get API and check if it's active
    try {
      const apiRecord = await adminPb.collection('apis').getOne(id)
      
      // Only check for API active status for non-admin users
      if (!isAdmin && !apiRecord.isActive) {
        throw createError({
          statusCode: 403,
          message: 'This API is currently inactive'
        })
      }

      // Extract the API fields we need
      const api: ApiRecord = {
        id: apiRecord.id,
        name: apiRecord.name,
        description: apiRecord.description,
        baseUrl: apiRecord.baseUrl,
        isActive: apiRecord.isActive,
        type: apiRecord.type,
        createdBy: apiRecord.createdBy,
        rateLimit: apiRecord.rateLimit
      }

      // For non-admin users, check department access
      if (!isAdmin) {
        // First get user's departments and expand department data
        const departments = await adminPb.collection('departments').getFullList()
        const activeDepartments = departments.filter(d => d.is_active === true)

        const departmentUsers = await adminPb.collection('department_users').getFullList({
          filter: `user_id = "${userId}"`
        })

        if (departmentUsers.length === 0) {
          throw createError({
            statusCode: 403,
            message: 'Access denied - No department membership'
          })
        }

        // Filter to get only active department IDs
        const activeDepartmentIds = departmentUsers
          .filter(du => activeDepartments.some(d => d.id === du.department_id))
          .map(du => du.department_id)

        if (activeDepartmentIds.length === 0) {
          throw createError({
            statusCode: 403,
            message: 'Access denied - No active department membership'
          })
        }

        // Check API access for active departments
        const filter = activeDepartmentIds.map(dId => `department_id = "${dId}"`).join(' || ')
        const departmentApis = await adminPb.collection('department_apis').getFullList({
          filter
        })

        if (!departmentApis.some(da => da.api_id === id)) {
          throw createError({
            statusCode: 403,
            message: 'Access denied to this API'
          })
        }
      }

      // Fetch endpoints for this API
      const endpoints = await adminPb.collection('endpoints').getFullList<EndpointRecord>({
        filter: `api = "${id}"`,
        sort: 'name'
      })

      // Fetch parameters for all endpoints
      const endpointIds = endpoints.map(endpoint => endpoint.id)
      let parameters: ParameterRecord[] = []
      
      if (endpointIds.length > 0) {
        const paramFilter = endpointIds.map(eid => `endpoint = "${eid}"`).join(' || ')
        parameters = await adminPb.collection('parameters').getFullList<ParameterRecord>({
          filter: paramFilter
        })
      }

      // Group parameters by endpoint
      const endpointsWithParams = endpoints.map(endpoint => ({
        id: endpoint.id,
        name: endpoint.name,
        description: endpoint.description,
        path: endpoint.path,
        method: endpoint.method,
        api: endpoint.api,
        parameters: parameters.filter(param => param.endpoint === endpoint.id)
      }))

      const response: ApiResponse = {
        ...api,
        endpoints: endpointsWithParams
      }

      return response

    } catch (error: any) {
      // Handle PocketBase specific errors
      if (error.status === 404) {
        throw createError({
          statusCode: 404,
          message: 'API not found'
        })
      }
      throw error // Let the outer catch block handle other errors
    }
  } catch (error: any) {
    console.error('Error in [id].get.ts:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal Server Error'
    })
  }
})