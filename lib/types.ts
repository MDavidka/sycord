import type { ObjectId } from "mongodb"

export interface User {
  _id: ObjectId
  email: string
  name?: string
  image?: string
  servers?: {
    serverId: string
    serverName: string
    serverIcon?: string
    isBotAdded: boolean
  }[]
  plugins?: UserPlugin[] // Changed from downloaded_plugins to plugins
}

export interface Plugin {
  _id: string
  name: string
  description: string
  iconUrl?: string
  thumbnailUrl?: string
  active: boolean
  installs: number
  createdAt: string
  updatedAt: string
}

export interface UserPlugin {
  pluginId: string
  name: string
  description: string
  installed_at: string
  iconUrl?: string
  thumbnailUrl?: string
}

export interface ServerConfig {
  server_id: string
  server_name: string
  server_icon?: string
  is_bot_added: boolean
  moderation_level: "off" | "on" | "lockdown"
  roles_and_names: { [key: string]: string }
  welcome: {
    enabled: boolean
    channel_id?: string
    message?: string
    dm_enabled?: boolean
  }
  moderation: {
    link_filter: {
      enabled: boolean
      config: "all_links" | "whitelist_only" | "phishing_only"
      whitelist?: string[]
    }
    bad_word_filter: {
      enabled: boolean
      custom_words?: string[]
    }
    raid_protection: {
      enabled: boolean
      threshold?: number
    }
    suspicious_accounts: {
      enabled: boolean
      min_age_days?: number
    }
    auto_role: {
      enabled: boolean
      role_id?: string
    }
    permission_abuse: {
      enabled: boolean
      notify_owner_on_role_change: boolean
      monitor_admin_actions: boolean
    }
    malicious_bot_detection: {
      enabled: boolean
      new_bot_notifications: boolean
      bot_activity_monitoring: boolean
      bot_timeout_threshold: number
    }
    token_webhook_abuse: {
      enabled: boolean
      webhook_creation_monitor: boolean
      webhook_auto_revoke: boolean
      webhook_verification_timeout: number
      leaked_webhook_scanner: boolean
    }
    invite_hijacking: {
      enabled: boolean
      invite_link_monitor: boolean
      vanity_url_watcher: boolean
    }
    mass_ping_protection: {
      enabled: boolean
      anti_mention_flood: boolean
      mention_rate_limit: number
      message_cooldown_on_raid: boolean
      cooldown_duration: number
    }
    malicious_file_scanner: {
      enabled: boolean
      suspicious_attachment_blocker: boolean
      auto_file_filter: boolean
      allowed_file_types?: string[]
    }
  }
  support: {
    ticket_system: {
      enabled: boolean
      channel_id?: string
      priority_role_id?: string
    }
    auto_answer: {
      enabled: boolean
      qa_pairs?: string
    }
  }
  giveaway: {
    enabled: boolean
    default_channel_id?: string
  }
  logs: {
    enabled: boolean
    channel_id?: string
    message_edits: boolean
    mod_actions: boolean
    member_joins: boolean
    member_leaves: boolean
  }
  last_updated?: string
  channels?: { [key: string]: string }
  server_stats?: {
    total_members?: number
    total_bots?: number
    total_admins?: number
  }
  botProfilePictureUrl?: string
  customBotName?: string
  botToken?: string
}
