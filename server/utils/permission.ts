import PocketBase from 'pocketbase'

interface DepartmentUser {
  department_id: string
  user_id: string
}

interface DepartmentApi {
  department_id: string
  api_id: string
}

export async function checkApiAccess(pb: PocketBase, userId: string, apiId?: string) {
  const isAdmin = pb.authStore.record?.role === 'admin'

  if (isAdmin) {
    return true
  }

  const departmentUsers = await pb.collection('department_users').getFullList<DepartmentUser>({
    filter: `user_id = "${userId}"`
  })

  if (departmentUsers.length === 0) {
    return false
  }

  const departmentIds = departmentUsers.map(du => du.department_id)
  const filter = departmentIds.map(id => `department_id = "${id}"`).join(' || ')
  
  const departmentApis = await pb.collection('department_apis').getFullList<DepartmentApi>({
    filter
  })

  if (departmentApis.length === 0) {
    return false
  }

  if (apiId) {
    return departmentApis.some(da => da.api_id === apiId)
  }

  return true
}

export async function getAccessibleApiIds(pb: PocketBase, userId: string) {
  const isAdmin = pb.authStore.record?.role === 'admin'

  if (isAdmin) {
    return null // null means all apis are accessible
  }

  const departmentUsers = await pb.collection('department_users').getFullList<DepartmentUser>({
    filter: `user_id = "${userId}"`
  })

  if (departmentUsers.length === 0) {
    return []
  }

  const departmentIds = departmentUsers.map(du => du.department_id)
  const filter = departmentIds.map(id => `department_id = "${id}"`).join(' || ')
  
  const departmentApis = await pb.collection('department_apis').getFullList<DepartmentApi>({
    filter
  })

  if (departmentApis.length === 0) {
    return []
  }

  return [...new Set(departmentApis.map(da => da.api_id))]
}