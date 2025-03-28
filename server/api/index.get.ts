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
        console.log('Fetching APIs for admin user')
        // Admin can see all APIs, both active and inactive
        const apis = await adminPb.collection('apis').getFullList()
        return apis
      } else if (userId) {
        console.log('Fetching APIs for normal user:', userId)
        
        // First get all departments
        console.log('Fetching departments')
        const departments = await adminPb.collection('departments').getFullList()
        console.log('Departments found:', departments.length)
        
        const activeDepartments = departments.filter(d => d.is_active === true)
        console.log('Active departments:', activeDepartments.length)

        // Get user's department memberships
        console.log('Fetching department memberships')
        const departmentUsers = await adminPb.collection('department_users').getFullList({
          filter: `user_id = "${userId}"`
        })
        console.log('Department memberships found:', departmentUsers.length)

        if (departmentUsers.length === 0) {
          console.log('No department memberships found')
          return [] // User not assigned to any department
        }

        // Filter to get only active department IDs
        const activeDepartmentIds = departmentUsers
          .filter(du => activeDepartments.some(d => d.id === du.department_id))
          .map(du => du.department_id)
        
        console.log('Active department memberships:', activeDepartmentIds.length)

        if (activeDepartmentIds.length === 0) {
          console.log('No active department memberships')
          return [] // User not assigned to any active department
        }

        // Get APIs for active departments
        console.log('Fetching department APIs')
        const filter = activeDepartmentIds.map(id => `department_id = "${id}"`).join(' || ')
        console.log('Department API filter:', filter)
        
        const departmentApis = await adminPb.collection('department_apis').getFullList({
          filter
        })
        console.log('Department APIs found:', departmentApis.length)

        if (departmentApis.length === 0) {
          console.log('No APIs assigned to departments')
          return [] // No APIs assigned to user's departments
        }

        const apiIds = [...new Set(departmentApis.map(da => da.api_id))]
        console.log('Unique API IDs:', apiIds.length)
        
        const apiFilter = `(${apiIds.map(id => `id = "${id}"`).join(' || ')}) && isActive = true`
        console.log('API filter:', apiFilter)
        
        const apis = await adminPb.collection('apis').getFullList({
          filter: apiFilter
        })
        console.log('Final APIs found:', apis.length)

        return apis
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