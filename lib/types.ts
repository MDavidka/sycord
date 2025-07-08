export interface User {
  id: string
  name: string
  email: string
  image?: string
  discordId: string
  accessToken?: string
  refreshToken?: string
}

export interface Server {
  serverId: string
  serverName: string
  serverIcon?: string
  ownerId: string
  isBotAdded: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ServerConfig {
  serverId: string
  serverName: string
  serverIcon?: string
  isBotAdded: boolean
  moderationLevel: "off" | "on" | "lockdown"
  rolesAndNames: { [key: string]: string }
  channels?: { [key: string]: string }
  welcome: {
    enabled: boolean
    channelId?: string
    message?: string
    dmEnabled?: boolean
  }
  moderation: {
    linkFilter: {
      enabled: boolean
      config: "all_links" | "whitelist_only" | "phishing_only"
      whitelist?: string[]
    }
    badWordFilter: {
      enabled: boolean
      customWords?: string[]
    }
    raidProtection: {
      enabled: boolean
      threshold?: number
    }
    suspiciousAccounts: {
      enabled: boolean
      minAgeDays?: number
    }
    autoRole: {
      enabled: boolean
      roleId?: string
    }
    permissionAbuse: {
      enabled: boolean
      notifyOwnerOnRoleChange: boolean
      monitorAdminActions: boolean
    }
    maliciousBotDetection: {
      enabled: boolean
      newBotNotifications: boolean
      botActivityMonitoring: boolean
      botTimeoutThreshold: number
    }
    tokenWebhookAbuse: {
      enabled: boolean
      webhookCreationMonitor: boolean
      webhookAutoRevoke: boolean
      webhookVerificationTimeout: number
      leakedWebhookScanner: boolean
    }
    inviteHijacking: {
      enabled: boolean
      inviteLinkMonitor: boolean
      vanityUrlWatcher: boolean
    }
    massPingProtection: {
      enabled: boolean
      antiMentionFlood: boolean
      mentionRateLimit: number
      messageCooldownOnRaid: boolean
      cooldownDuration: number
    }
    maliciousFileScanner: {
      enabled: boolean
      suspiciousAttachmentBlocker: boolean
      autoFileFilter: boolean
      allowedFileTypes?: string[]
    }
  }
  support: {
    ticketSystem: {
      enabled: boolean
      channelId?: string
      priorityRoleId?: string
    }
    autoAnswer: {
      enabled: boolean
      qaPairs?: string
    }
  }
  giveaway: {
    enabled: boolean
    defaultChannelId?: string
  }
  logs: {
    enabled: boolean
    channelId?: string
    messageEdits: boolean
    modActions: boolean
    memberJoins: boolean
    memberLeaves: boolean
  }
  serverStats?: {
    totalMembers?: number
    totalBots?: number
    totalAdmins?: number
  }
  lastUpdated?: Date
}

export interface BotSettings {
  serverId: string
  name: string
  avatar: string
  status: "online" | "idle" | "dnd" | "offline"
  version: string
  updatedAt: Date
}

export interface Announcement {
  _id: string
  title: string
  message: string
  type: "info" | "warning" | "success"
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  enabled: boolean
  category: string
  permissions: string[]
  commands: string[]
}

export interface BotServer {
  serverId: string
  serverName: string
  serverIcon?: string
  memberCount: number
  addedAt: Date
  isActive: boolean
}

export interface UserServer {
  serverId: string
  serverName: string
  serverIcon?: string
  isBotAdded: boolean
  addedAt?: Date
}

export interface DiscordGuild {
  id: string
  name: string
  icon?: string
  owner: boolean
  permissions: string
  approximate_member_count?: number
}
