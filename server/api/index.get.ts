import { H3Event } from 'h3'
import { getAdminPocketBase, getUserPocketBase } from '../utils/pocketbase'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the authorization header
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - No token provided'
      })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Initialize both PocketBase instances
    const adminPb = getAdminPocketBase()
    const userPb = await getUserPocketBase(token);

    // Validate user's token
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

    const isAdmin = userPb.authStore.record?.role === 'admin'
    const userId = userPb.authStore.record?.id

    try {
      if (isAdmin) {
        // Admin can see all APIs from the api_details view
        const apis = await adminPb.collection('api_details').getFullList()
        // Transform the response to match frontend expectations
        return apis.map(api => ({
          id: api.id,
          name: api.name,
          description: api.description,
          type: api.type,
          status: api.status,  // Remove the boolean conversion since the view already returns correct status
          rateLimit: api.rateLimit,
          endpointCount: api.endpointCount,
          createdAt: api.createdAt
        }))
      } else if (userId) {
        // First get all departments
        const departments = await adminPb.collection('departments').getFullList()
        
        const activeDepartments = departments.filter(d => d.is_active === true)

        // Get user's department memberships
        const departmentUsers = await adminPb.collection('department_users').getFullList({
          filter: `user_id = "${userId}"`
        })

        if (departmentUsers.length === 0) {
          return [] // User not assigned to any department
        }

        // Filter to get only active department IDs
        const activeDepartmentIds = departmentUsers
          .filter(du => activeDepartments.some(d => d.id === du.department_id))
          .map(du => du.department_id)
        

        if (activeDepartmentIds.length === 0) {
          return [] // User not assigned to any active department
        }

        // Get APIs for active departments
        const filter = activeDepartmentIds.map(id => `department_id = "${id}"`).join(' || ')
        
        const departmentApis = await adminPb.collection('department_apis').getFullList({
          filter
        })

        if (departmentApis.length === 0) {
          return [] // No APIs assigned to user's departments
        }

        const apiIds = [...new Set(departmentApis.map(da => da.api_id))]
        
        const apiFilter = `(${apiIds.map(id => `id = "${id}"`).join(' || ')}) && status = true`
        
        const apis = await adminPb.collection('api_details').getFullList({
          filter: apiFilter
        })

        // Transform the response to match frontend expectations
        return apis.map(api => ({
          id: api.id,
          name: api.name,
          description: api.description,
          type: api.type,
          status: api.status,  // Remove the boolean conversion since the view already returns correct status
          rateLimit: api.rateLimit,
          endpointCount: api.endpointCount,
          createdAt: api.createdAt
        }))
      }

      return []
    } catch (error: any) {
      console.error('Detailed error:', {
        message: error.message,
        data: error.data,
        url: error.url,
        response: error.response,
        stack: error.stack
      })
      throw error
    }
  } catch (error: any) {
    console.error('Error in index.get.ts:', {
      message: error.message,
      data: error.data,
      url: error.url,
      response: error.response,
      stack: error.stack
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal Server Error'
    })
  }
})