export type DiscoveryProgressStep =
  | 'analyzing'
  | 'searching'
  | 'matching'
  | 'intro_ready'

export type UserContextView = {
  situation: string
  goals: string[]
  obstacles: string[]
  emotional_context: string
}

export type CandidateView = {
  name: string
  similarity: number
}

export type PersonMatchView = {
  person_id: string
  name: string
  bio: string
  current_situation: string
  similarity_score: number
  reasoning: string
  role: 'future_self' | 'comrade' | 'guide'
  evidence: string[]
  distance_label?: string | null
  first_question?: string | null
}

export type ActionPlanItemView = {
  title: string
  rationale: string
  target_person_id?: string | null
}

export type IntroDraftView = {
  person_id: string
  person_name: string
  direct_message: string
  intro_request: string
}

export type ForumMessageView = {
  agent: string
  content: string
  round: number
}

export type DiscoveryResultView = {
  current_state_summary: string
  primary_blocker: string
  desired_next_step: string
  future_self: PersonMatchView
  comrade: PersonMatchView
  guide: PersonMatchView
  action_plan: ActionPlanItemView[]
  intro_drafts: IntroDraftView[]
  discussion: ForumMessageView[]
}

export type StatusEvent = {
  type: 'status'
  data: {
    step: DiscoveryProgressStep
    label: string
  }
}

export type ContextEvent = {
  type: 'context'
  data: UserContextView
}

export type CandidatesEvent = {
  type: 'candidates'
  data: {
    count: number
    people: CandidateView[]
  }
}

export type ForumEvent = {
  type: 'forum'
  data: ForumMessageView
}

export type ResultEvent = {
  type: 'result'
  data: DiscoveryResultView
}

export type DiscoveryEvent =
  | StatusEvent
  | ContextEvent
  | CandidatesEvent
  | ForumEvent
  | ResultEvent
