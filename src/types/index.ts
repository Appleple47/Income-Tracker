export interface Job {
  id: string
  name: string
  wage: number
  color: string
  position: number
}

export interface Entry {
  id: number
  jobId: string
  jobName: string
  hours: number
  wage: number
  income: number
  transport: number
  memo: string
  date: string
  deleted: boolean
  deletedAt?: string
}

export interface AppState {
  jobs: Job[]
  entries: Entry[]   // active only
  trash: Entry[]     // deleted entries
}
