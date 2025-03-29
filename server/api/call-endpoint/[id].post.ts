import { getAdminPocketBase, getUserPocketBase } from '../../utils/pocketbase'

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Endpoint ID is required'
      })
    }

    // Check authentication
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

    // Get the endpoint details
    const endpoint = await adminPb.collection('endpoints').getOne(id, {
      expand: 'api'
    })

    if (!endpoint) {
      throw createError({
        statusCode: 404,
        message: 'Endpoint not found'
      })
    }

    // Check if API is active (for non-admin users)
    if (!isAdmin && !endpoint.expand?.api?.isActive) {
      throw createError({
        statusCode: 403,
        message: 'This API is currently inactive'
      })
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

      if (!departmentApis.some(da => da.api_id === endpoint.expand?.api?.id)) {
        throw createError({
          statusCode: 403,
          message: 'Access denied to this API'
        })
      }
    }

    // Get all parameters for this endpoint
    const parameters = await adminPb.collection('parameters').getFullList({
      filter: `endpoint = "${id}"`
    })

    // Get the request body
    const body = await readBody(event)

    // Build the URL with path parameters
    const baseUrl = endpoint.expand?.api?.baseUrl || ''
    let path = endpoint.path
    
    // Process parameters
    const queryParams = new URLSearchParams()
    const headers = new Headers({
      'Accept': 'application/json'
    })
    let requestBody: Record<string, any> | FormData | undefined
    
    // First, handle path parameters to construct the URL
    parameters.forEach(param => {
      if (param.param_in === 'path') {
        const paramValue = body[param.name]
        if (!paramValue && param.required) {
          throw createError({
            statusCode: 400,
            message: `Required path parameter '${param.name}' is missing`
          })
        }
        path = path.replace(`{${param.name}}`, paramValue)
      }
    })

    // Construct URL - ensure both baseUrl and path are properly combined
    // Remove trailing slash from baseUrl and leading slash from path
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    // Handle case where path is just '/' by using base URL directly
    const url = new URL(cleanPath === '' ? cleanBaseUrl : `${cleanBaseUrl}/${cleanPath}`)
    
    // Handle other parameter types
    let isFormData = false
    parameters.forEach(param => {
      const paramValue = body[param.name]
      
      if (param.required && paramValue === undefined) {
        throw createError({
          statusCode: 400,
          message: `Required parameter '${param.name}' is missing`
        })
      }

      if (paramValue !== undefined) {
        switch (param.param_in) {
          case 'query':
            queryParams.append(param.name, paramValue)
            break
          case 'header':
            headers.append(param.name, paramValue)
            break
          case 'body':
            if (!requestBody || isFormData) {
              requestBody = {} as Record<string, any>
            }
            if (requestBody && !isFormData) {
              (requestBody as Record<string, any>)[param.name] = paramValue
            }
            break
          case 'formdata':
            if (!requestBody || !(requestBody instanceof FormData)) {
              requestBody = new FormData()
              isFormData = true
            }
            if (param.type === 'file') {
              const file = paramValue
              if (file) {
                (requestBody as FormData).append(param.name, file)
              }
            } else {
              (requestBody as FormData).append(param.name, paramValue)
            }
            break
        }
      }
    })

    // Add query parameters to URL
    url.search = queryParams.toString()

    // Make the external API call
    let response;
    try {
      response = await fetch(url, {
        method: endpoint.method,
        headers,
        body: isFormData ? requestBody as FormData :
              requestBody ? JSON.stringify(requestBody) : undefined
      });
    } catch (error: any) {
      // Handle network errors or failed fetch attempts
      return {
        statusCode: 503,
        data: {
          error: 'Service Unavailable',
          message: 'Failed to connect to the external API',
          details: error.message
        }
      };
    }

    // Check content type to determine how to parse the response
    const contentType = response.headers.get('content-type');
    let responseData = null;

    try {
      if (contentType?.includes('application/json')) {
        // Try to parse as JSON
        responseData = await response.json();
      } else {
        // For non-JSON responses, get the text
        const textContent = await response.text();
        responseData = {
          content: textContent,
          contentType: contentType || 'text/plain'
        };
      }
    } catch (error: any) {
      return {
        statusCode: 502,
        data: {
          error: 'Bad Gateway',
          message: 'Failed to parse the API response',
          details: error.message
        }
      };
    }

    // Return the response with the same status code
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData
    };

  } catch (error: any) {
    // Handle other errors
    if (error.statusCode) {
      throw error;
    }
    
    return {
      statusCode: 500,
      data: {
        error: 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
      }
    };
  }
})