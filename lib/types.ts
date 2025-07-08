export interface User {
  _id?: string
  discordId: string
  username: string
  avatar?: string
  servers: UserServer[]
  createdAt: Date
  lastLogin: Date
}

export interface UserServer {
  server_id: string
  server_name: string
  server_icon?: string
  is_bot_added: boolean
  last_updated: Date
}

export interface BotServer {
  _id?: string
  serverId: string
  serverName: string
  serverIcon?: string
  ownerId: string
  botAdded: boolean
  joinedAt: Date
  lastActivity: Date
  memberCount?: number
}

export interface ServerSettings {
  _id?: string
  serverId: string
  ownerId: string
  moderation: {
    enabled: boolean
    automod: boolean
    spam_protection: boolean
    bad_words_filter: boolean
    max_mentions: number
    max_emojis: number
  }
  welcome: {
    enabled: boolean
    channel?: string
    message?: string
    auto_role?: string
  }
  support: {
    ticket_system: {
      enabled: boolean
      category?: string
      support_role?: string
    }
  }
  custom_commands: Array<{
    trigger: string
    response: string
    enabled: boolean
  }>
  createdAt: Date
  updatedAt: Date
}
