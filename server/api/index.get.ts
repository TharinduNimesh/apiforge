import { H3Event } from 'h3'
import { getAdminPocketBase, getUserPocketBase } from '../utils/pocketbase'

export default defineEventHandler(async (event: H3Event) => {
  console.log('[API] Starting GET /api request handler')
  try {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader) {
      console.warn('[API] No authorization header provided')
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - No token provided'
      })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('[API] Authorization token received')
    
    console.log('[API] Initializing PocketBase instances')
    const adminPb = getAdminPocketBase()
    const userPb = await getUserPocketBase(token)

    console.log('[API] Checking PocketBase health')
    try {
      const health = await adminPb.health.check()
      console.log('[API] PocketBase Health Check:', health)
    } catch (error: any) {
      console.error('[API] PocketBase Health Check Failed:', error)
      throw createError({
        statusCode: 503,
        message: 'Database service unavailable'
      })
    }

    try {
      if (!userPb.authStore.isValid) {
        console.warn('[API] Invalid user token detected')
        throw new Error('Invalid token')
      }
      console.log('[API] User token validated successfully')
    } catch (error) {
      throw createError({
        statusCode: 401,
        message: 'Invalid token'
      })
    }

    const isAdmin = userPb.authStore.record?.role === 'admin'
    const userId = userPb.authStore.record?.id
    console.log('[API] User context:', { isAdmin, userId })

    try {
      if (isAdmin) {
        console.log('[API] Processing admin user request')
        try {
          console.log('[API] Checking api_details collection')
          await adminPb.collection('api_details').getList(1, 1)
          const apis = await adminPb.collection('api_details').getFullList()
          console.log(`[API] Retrieved ${apis.length} APIs for admin user`)
          return apis.map(api => ({
            id: api.id,
            name: api.name,
            description: api.description,
            type: api.type,
            status: api.status,
            rateLimit: api.rateLimit,
            endpointCount: api.endpointCount,
            createdAt: api.createdAt
          }))
        } catch (error: any) {
          console.error('[API] Admin API fetch error:', {
            message: error.message,
            status: error.status,
            data: error.data
          })
          if (error.status === 404) {
            console.log('[API] api_details collection does not exist')
            return []
          }
          throw error
        }
      } else if (userId) {
        console.log('[API] Processing regular user request')
        try {
          console.log('[API] Checking departments collection')
          await adminPb.collection('departments').getList(1, 1)
          const departments = await adminPb.collection('departments').getFullList()
          console.log(`[API] Found ${departments.length} total departments`)
          
          const activeDepartments = departments.filter(d => d.is_active === true)
          console.log(`[API] Found ${activeDepartments.length} active departments`)

          console.log('[API] Checking department_users collection')
          await adminPb.collection('department_users').getList(1, 1)
          const departmentUsers = await adminPb.collection('department_users').getFullList({
            filter: `user_id = "${userId}"`
          })
          console.log(`[API] Found ${departmentUsers.length} department assignments for user ${userId}`)

          if (departmentUsers.length === 0) {
            console.log(`[API] User ${userId} has no department assignments`)
            return []
          }

          const activeDepartmentIds = departmentUsers
            .filter(du => activeDepartments.some(d => d.id === du.department_id))
            .map(du => du.department_id)
          
          console.log(`[API] User ${userId} has ${activeDepartmentIds.length} active departments`)

          if (activeDepartmentIds.length === 0) {
            return []
          }

          console.log('[API] Checking department_apis collection')
          await adminPb.collection('department_apis').getList(1, 1)
          const filter = activeDepartmentIds.map(id => `department_id = "${id}"`).join(' || ')
          console.log('[API] Department APIs filter:', filter)
          
          const departmentApis = await adminPb.collection('department_apis').getFullList({
            filter
          })
          console.log(`[API] Found ${departmentApis.length} API assignments for departments`)

          if (departmentApis.length === 0) {
            return []
          }

          const apiIds = [...new Set(departmentApis.map(da => da.api_id))]
          const apiFilter = `(${apiIds.map(id => `id = "${id}"`).join(' || ')}) && status = true`
          console.log('[API] Final API filter:', apiFilter)
          
          console.log('[API] Checking api_details collection')
          await adminPb.collection('api_details').getList(1, 1)
          const apis = await adminPb.collection('api_details').getFullList({
            filter: apiFilter
          })
          console.log(`[API] Found ${apis.length} accessible APIs for user ${userId}`)

          return apis.map(api => ({
            id: api.id,
            name: api.name,
            description: api.description,
            type: api.type,
            status: api.status,
            rateLimit: api.rateLimit,
            endpointCount: api.endpointCount,
            createdAt: api.createdAt
          }))
        } catch (error: any) {
          console.error('[API] User API fetch error:', {
            message: error.message,
            status: error.status,
            data: error.data
          })
          if (error.status === 404) {
            console.log('[API] Required collection does not exist')
            return []
          }
          throw error
        }
      }

      return []
    } catch (error: any) {
      console.error('[API] Detailed error:', {
        message: error.message,
        status: error.status,
        data: error.data,
        url: error.url,
        response: error.response,
        stack: error.stack
      })
      
      if (error.status === 404) {
        return []
      }
      
      throw error
    }
  } catch (error: any) {
    console.error('[API] Error in index.get.ts:', {
      message: error.message,
      data: error.data,
      url: error.url,
      response: error.response,
      stack: error.stack
    })
    throw createError({
      statusCode: error.statusCode || error.status || 500,
      message: error.message || 'Internal Server Error'
    })
  }
})