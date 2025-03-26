import { usePocketBase } from '../../utils/pocketbase'

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id
    console.log('🔵 [API Call] Starting request for endpoint ID:', id)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Endpoint ID is required'
      })
    }

    const pb = usePocketBase()

    // Get the endpoint details
    const endpoint = await pb.collection('endpoints').getOne(id, {
      expand: 'api'
    })

    if (!endpoint) {
      throw createError({
        statusCode: 404,
        message: 'Endpoint not found'
      })
    }

    console.log('🔵 [API Call] Found endpoint:', {
      name: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      apiId: endpoint.api,
      baseUrl: endpoint.expand?.api?.baseUrl
    })

    // Get all parameters for this endpoint
    const parameters = await pb.collection('parameters').getFullList({
      filter: `endpoint = "${id}"`
    })
    console.log('🔵 [API Call] Found parameters:', parameters.map(p => ({
      name: p.name,
      type: p.type,
      param_in: p.param_in,
      required: p.required
    })))

    // Get the request body
    const body = await readBody(event)
    console.log('🔵 [API Call] Received request body:', body)

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
    
    console.log('🔵 [API Call] Constructed base URL:', url.toString())

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
            console.log('🔵 [API Call] Added query parameter:', param.name, paramValue)
            break
          case 'header':
            headers.append(param.name, paramValue)
            console.log('🔵 [API Call] Added header:', param.name, paramValue)
            break
          case 'body':
            if (!requestBody || isFormData) {
              requestBody = {}
            }
            requestBody[param.name] = paramValue
            console.log('🔵 [API Call] Added body parameter:', param.name, paramValue)
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
                console.log('🔵 [API Call] Added file parameter:', param.name)
              }
            } else {
              (requestBody as FormData).append(param.name, paramValue)
              console.log('🔵 [API Call] Added form parameter:', param.name, paramValue)
            }
            break
        }
      }
    })

    // Add query parameters to URL
    url.search = queryParams.toString()
    console.log('🔵 [API Call] Final URL with query parameters:', url.toString())
    console.log('🔵 [API Call] Request configuration:', {
      method: endpoint.method,
      headers: Object.fromEntries(headers.entries()),
      bodyType: isFormData ? 'FormData' : (requestBody ? 'JSON' : 'none'),
      hasBody: !!requestBody
    })

    // Make the external API call
    const response = await fetch(url, {
      method: endpoint.method,
      headers,
      body: isFormData ? requestBody : 
            requestBody ? JSON.stringify(requestBody) : undefined
    })

    // Check content type to determine how to parse the response
    const contentType = response.headers.get('content-type')
    let responseData = null

    if (contentType?.includes('application/json')) {
      // Try to parse as JSON
      responseData = await response.json().catch((err) => {
        console.log('🔴 [API Call] Error parsing response as JSON:', err)
        return null
      })
    } else {
      // For non-JSON responses, get the text
      const textContent = await response.text()
      responseData = {
        content: textContent,
        contentType: contentType || 'text/plain'
      }
    }
    
    console.log('🔵 [API Call] Received response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData
    })

    // Return the response with the same status code
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData
    }

  } catch (error: any) {
    // Handle errors
    console.error('🔴 [API Call] Error:', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    })
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error'
    })
  }
})