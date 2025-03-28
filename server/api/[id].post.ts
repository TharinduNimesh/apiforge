import { getAdminPocketBase } from '../utils/pocketbase'

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'API ID is required'
      })
    }

    const pb = getAdminPocketBase()

    // Get current API record
    const record = await pb.collection('apis').getOne(id)
    
    // Toggle the isActive status
    const updatedRecord = await pb.collection('apis').update(id, {
      isActive: !record.isActive
    })

    return updatedRecord
  } catch (error: any) {
    throw createError({
      statusCode: error.status || 500,
      message: error.message
    })
  }
})