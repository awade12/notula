export type SpaceId = string & { readonly __brand: 'SpaceId' }
export type PageId = string & { readonly __brand: 'PageId' }
export type DatabaseId = string & { readonly __brand: 'DatabaseId' }
export type UserId = string & { readonly __brand: 'UserId' }

export function asSpaceId(id: string): SpaceId {
  return id as SpaceId
}

export function asPageId(id: string): PageId {
  return id as PageId
}

export function asDatabaseId(id: string): DatabaseId {
  return id as DatabaseId
}

export function asUserId(id: string): UserId {
  return id as UserId
}
