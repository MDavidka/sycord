0 "use client"
1 
2 import { useSession } from "next-auth/react"
3 import { useRouter, useParams } from "next/navigation"
4 import { useEffect, useState } from "react"
5 import { Button } from "@/components/ui/button"
6 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
7 import { Switch } from "@/components/ui/switch"
8 import { Input } from "@/components/ui/input"
9 import { Label } from "@/components/ui/label"
10 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
11 import {
12   DropdownMenu,
13   DropdownMenuContent,
14   DropdownMenuItem,
15   DropdownMenuTrigger,
16   DropdownMenuSeparator,
17 } from "@/components/ui/dropdown-menu"
18 import {
19   Dialog,
20   DialogContent,
21   DialogDescription,
22   DialogHeader,
23   DialogTitle,
24   DialogTrigger,
25   DialogFooter,
26 } from "@/components/ui/dialog"
27 import {
28   Shield,
29   MessageSquare,
30   Gift,
31   LinkIcon,
32   Filter,
33   Hash,
34   ChevronDown,
35   Home,
36   Plus,
37   Copy,
38   Check,
39   LogIn,
40   ArrowLeft,
41   Clock,
42   AlertTriangle,
43   Info,
44   Eye,
45   Bot,
46   Webhook,
47   MessageCircle,
48   FileText,
49   Zap,
50   UserCheck,
51   Users,
52   Crown,
53   Package,
54   Settings,
55   Lock,
56   Megaphone,
57   Flag,
58   LifeBuoy,
59   Download,
60   Ticket,
61   BarChart3,
62   CheckCircle,
63   AlertCircle,
64   Mail,
65 } from "lucide-react"
66 import Image from "next/image"
67 import Link from "next/link"
68 import { Alert, AlertDescription } from "@/components/ui/alert"
69 import PluginsTab from "@/components/plugins-tab"
70 import { Progress } from "@/components/ui/progress"
71 import { Badge } from "@/components/ui/badge"
72 import { Separator } from "@/components/ui/separator"
73 import { toast } from "sonner"
74 import { Textarea } from "@/components/ui/textarea"
75 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
76 
77 // Define UserData interface
78 interface UserData {
79   name: string
80   email: string
81   joined_since: string
82 }
83 
84 interface StaffMember {
85   userId: string
86   username: string
87   reputation: number
88   maxReputation: number
89 }
90 
91 interface TicketEmbed {
92   title: string
93   description: string
94   color: string
95   thumbnail?: string
96   footer?: string
97   fields?: {
98     name: string
99     value: string
100     inline?: boolean
101   }[]
102 }
103 
104 interface TicketSettings {
105   autoAnswer: {
106     enabled: boolean
107     qa_pairs: string
108   }
109   blockedUsers: {
110     enabled: boolean
111     userIds: string[]
112   }
113   inactivityClose: {
114     enabled: boolean
115     timeoutMinutes: number
116   }
117   logging: {
118     enabled: boolean
119     channelId?: string
120   }
121 }
122 
123 // Update the ServerConfig interface to match the new structure
124 interface ServerConfig {
125   server_id: string
126   server_name: string
127   server_icon?: string
128   is_bot_added: boolean
129   moderation_level: "off" | "on" | "lockdown"
130   roles_and_names: { [key: string]: string }
131   welcome: {
132     enabled: boolean
133     channel_id?: string
134     message?: string
135     dm_enabled?: boolean
136   }
137   moderation: {
138     // Basic filters
139     link_filter: {
140       enabled: boolean
141       config: "all_links" | "whitelist_only" | "phishing_only"
142     }
143     bad_word_filter: {
144       enabled: boolean
145       custom_words?: string[]
146     }
147     raid_protection: {
148       enabled: boolean
149       threshold?: number
150     }
151     suspicious_accounts: {
152       enabled: boolean
153       min_age_days?: number
154     }
155     auto_role: {
156       enabled: boolean
157       role_id?: string
158     }
159 
160     // Advanced security features
161     permission_abuse: {
162       enabled: boolean
163       notify_owner_on_role_change: boolean
164       monitor_admin_actions: boolean
165     }
166     malicious_bot_detection: {
167       enabled: boolean
168       new_bot_notifications: boolean
169       bot_activity_monitoring: boolean
170       bot_timeout_threshold: number
171     }
172     token_webhook_abuse: {
173       enabled: boolean
174       webhook_creation_monitor: boolean
175       webhook_auto_revoke: boolean
176       webhook_verification_timeout: number
177       leaked_webhook_scanner: boolean
178     }
179     invite_hijacking: {
180       enabled: boolean
181       invite_link_monitor: boolean
182       vanity_url_watcher: boolean
183     }
184     mass_ping_protection: {
185       enabled: boolean
186       anti_mention_flood: boolean
187       mention_rate_limit: number
188       message_cooldown_on_raid: boolean
189       cooldown_duration: number
190     }
191     malicious_file_scanner: {
192       enabled: boolean
193       suspicious_attachment_blocker: boolean
194       auto_file_filter: boolean
195       allowed_file_types?: string[]
196     }
197   }
198   support: {
199     staff: StaffMember[]
200     reputation_enabled: boolean
201     max_reputation_score: number
202     ticket_system: {
203       enabled: boolean
204       channel_id?: string
205       priority_role_id?: string
206       embed: TicketEmbed
207       settings: TicketSettings
208     }
209   }
210   giveaway: {
211     enabled: boolean
212     default_channel_id?: string
213   }
214   logs: {
215     enabled: boolean
216     channel_id?: string
217     message_edits: boolean
218     mod_actions: boolean
219     member_joins: boolean
220     member_leaves: boolean
221   }
222   invite_tracking: {
223     enabled: boolean
224     channel_id?: string
225     track_joins: boolean
226     track_leaves: boolean
227   }
228   automatic_tasks: {
229     enabled: boolean
230     tasks: { id: string; name: string; type: string; status: string }[]
231   }
232   last_updated?: string
233   channels?: { [key: string]: string }
234   server_stats?: {
235     total_members?: number
236     total_bots?: number
237     total_admins?: number
238   }
239   // New fields for custom bot
240   botProfilePictureUrl?: string
241   customBotName?: string
242   botToken?: string
243 }
244 
245 interface AppSettings {
246   maintenanceMode: {
247     enabled: boolean
248     estimatedTime?: string
249   }
250 }
251 
252 interface Announcement {
253   _id: string
254   message: string
255   createdAt: string
256 }
257 
258 type SupportView = "overview" | "staff-insights" | "tickets"
259 type EventView = "overview" | "automatic-task" | "giveaway" | "logger" | "invite-track"
260 
261 export default function ServerConfigPage() {
262   const { data: session, status } = useSession()
263   const router = useRouter()
264   const params = useParams()
265   const serverId = params.serverId as string
266 
267   // Add state for modals
268   const [showInfoModal, setShowInfoModal] = useState(false)
269   const [showReputationInfo, setShowReputationInfo] = useState(false)
270   const [showEmbedSettings, setShowEmbedSettings] = useState(false)
271   const [showTicketSettings, setShowTicketSettings] = useState(false)
272   const [showLockdownWarning, setShowLockdownWarning] = useState(false)
273   const [showFlagStaffWarning, setShowFlagStaffWarning] = useState(false)
274   const [staffToFlag, setStaffToFlag] = useState<string | null>(null)
275 
276   const [activeSupportSection, setActiveSupportSection] = useState<"staff" | "tickets" | null>(null)
277 
278   const [userData, setUserData] = useState<UserData | null>(null)
279   const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null)
280   const [userServers, setUserServers] = useState<any[]>([])
281   const [loading, setLoading] = useState(true)
282   const [saving, setSaving] = useState(false)
283   const [activeTab, setActiveTab] = useState("home") // Changed default active tab to "home"
284   const [supportView, setSupportView] = useState<SupportView>("overview")
285   const [activeEventSection, setActiveEventSection] = useState<EventView>("overview")
286 
287   // Giveaway state
288   const [giveawayStep, setGiveawayStep] = useState(1)
289   const [giveawayData, setGiveawayData] = useState<any>({
290     method: null,
291     title: "",
292     prize: "",
293     description: "",
294     endDate: "",
295     winners: 1,
296     channel: "",
297     requireMembership: false,
298     requireRole: false,
299     requireAccountAge: false,
300     selectedRole: "",
301     requireLogin: false,
302     customUrl: "",
303   })
304   const [generatedLink, setGeneratedLink] = useState("")
305   const [linkCopied, setLinkCopied] = useState(false)
306   const [giveawayCreated, setGiveawayCreated] = useState(false)
307 
308   // Settings tab state
309   const [profilePictureUrl, setProfilePictureUrl] = useState("")
310   const [customBotName, setCustomBotName] = useState("")
311   const [botToken, setBotToken] = useState("")
312   const [showToken, setShowToken] = useState(false)
313 
314   const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
315   const [newAnnouncement, setNewAnnouncement] = useState("")
316   const [announcements, setAnnouncements] = useState<Announcement[]>([])
317   const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])
318 
319   useEffect(() => {
320     if (status === "unauthenticated") {
321       router.push("/login")
322     }
323   }, [status, router])
324 
325   useEffect(() => {
326     if (session && serverId) {
327       loadData()
328       fetchAppSettings()
329       fetchAnnouncements()
330     }
331   }, [session, serverId])
332 
333   useEffect(() => {
334     if (serverConfig) {
335       setProfilePictureUrl(serverConfig.botProfilePictureUrl || "")
336       setCustomBotName(serverConfig.customBotName || "")
337       setBotToken(serverConfig.botToken || "")
338     }
339   }, [serverConfig])
340 
341   const loadData = async () => {
342     try {
343       // Load user servers for navbar
344       const userServersResponse = await fetch("/api/user-servers")
345       if (userServersResponse.ok) {
346         const userServersData = await userServersResponse.json()
347         setUserServers(userServersData.servers)
348       }
349 
350       // Load user and server configuration
351       const configResponse = await fetch(`/api/user-config/${serverId}`)
352       if (configResponse.ok) {
353         const configData = await configResponse.json()
354         // Initialize default values for new fields if they don't exist
355         const initialConfig: ServerConfig = {
356           ...configData.server,
357           support: {
358             ...configData.server.support,
359             reputation_enabled: configData.server.support?.reputation_enabled ?? false,
360             max_reputation_score: configData.server.support?.max_reputation_score ?? 20,
361             ticket_system: {
362               ...configData.server.support?.ticket_system,
363               enabled: configData.server.support?.ticket_system?.enabled ?? false,
364               embed: configData.server.support?.ticket_system?.embed || {
365                 title: "Support Ticket",
366                 description: "Click the button below to create a support ticket.",
367                 color: "#5865F2",
368                 footer: "Support Team",
369               },
370               settings: configData.server.support?.ticket_system?.settings || {
371                 autoAnswer: { enabled: false, qa_pairs: "" },
372                 blockedUsers: { enabled: false, userIds: [] },
373                 inactivityClose: { enabled: false, timeoutMinutes: 30 },
374                 logging: { enabled: false },
375               },
376             },
377           },
378           logs: {
379             ...configData.server.logs,
380             enabled: configData.server.logs?.enabled ?? false,
381             message_edits: configData.server.logs?.message_edits ?? false,
382             mod_actions: configData.server.logs?.mod_actions ?? false,
383             member_joins: configData.server.logs?.member_joins ?? false,
384             member_leaves: configData.server.logs?.member_leaves ?? false,
385           },
386           invite_tracking: {
387             enabled: configData.server.invite_tracking?.enabled ?? false,
388             track_joins: configData.server.invite_tracking?.track_joins ?? false,
389             track_leaves: configData.server.invite_tracking?.track_leaves ?? false,
390           },
391           automatic_tasks: {
392             enabled: configData.server.automatic_tasks?.enabled ?? false,
393             tasks: configData.server.automatic_tasks?.tasks ?? [],
394           },
395         }
396         setServerConfig(initialConfig)
397         setUserData(configData.user)
398       }
399     } catch (error) {
400       console.error("Error loading data:", error)
401     } finally {
402       setLoading(false)
403     }
404   }
405 
406   const updateServerConfig = async (updates: Partial<ServerConfig>) => {
407     if (!serverConfig) return
408 
409     const newConfig = { ...serverConfig, ...updates }
410     setServerConfig(newConfig)
411 
412     // Auto-save
413     try {
414       await fetch(`/api/user-config/${serverId}`, {
415         method: "PUT",
416         headers: {
417           "Content-Type": "application/json",
418         },
419         body: JSON.stringify({ server: newConfig }),
420       })
421     } catch (error) {
422       console.error("Error auto-saving configuration:", error)
423     }
424   }
425 
426   const getRoleName = (roleId: string) => {
427     if (!serverConfig?.roles_and_names[roleId]) return "Unknown Role"
428     return serverConfig.roles_and_names[roleId]
429   }
430 
431   const getChannelName = (channelId: string) => {
432     if (!serverConfig?.channels || !serverConfig.channels[channelId]) {
433       return "Unknown Channel"
434     }
435     return serverConfig.channels[channelId]
436   }
437 
438   // Staff management functions
439   const handleFlagStaffClick = (userId: string) => {
440     setStaffToFlag(userId)
441     setShowFlagStaffWarning(true)
442   }
443 
444   const confirmFlagStaff = () => {
445     if (!serverConfig || !staffToFlag) return
446 
447     const updatedStaff = serverConfig.support.staff.map((staff) =>
448       staff.userId === staffToFlag ? { ...staff, reputation: 5 } : staff,
449     )
450 
451     updateServerConfig({
452       support: {
453         ...serverConfig.support,
454         staff: updatedStaff,
455       },
456     })
457     setShowFlagStaffWarning(false)
458     setStaffToFlag(null)
459   }
460 
461   // Send ticket embed function
462   const sendTicketEmbed = async () => {
463     if (!serverConfig?.support?.ticket_system?.channel_id) return
464 
465     try {
466       // In a real implementation, this would send the embed to Discord
467       console.log("Sending ticket embed to channel:", serverConfig.support.ticket_system.channel_id)
468       // You would implement the actual Discord API call here
469     } catch (error) {
470       console.error("Error sending ticket embed:", error)
471     }
472   }
473 
474   // Giveaway functions
475   const handleMethodSelect = (method: "server" | "link") => {
476     setGiveawayData({ ...giveawayData, method })
477     setGiveawayStep(2)
478   }
479 
480   const handleNextStep = () => {
481     if (giveawayStep < 3) {
482       setGiveawayStep(giveawayStep + 1)
483     }
484   }
485 
486   const handlePrevStep = () => {
487     if (giveawayStep > 1) {
488       setGiveawayStep(giveawayStep - 1)
489     }
490   }
491 
492   const handleCreateGiveaway = () => {
493     if (giveawayData.method === "link") {
494       const baseUrl = "ltpd.xyz"
495       const randomId = Math.floor(Math.random() * 1000000)
496         .toString()
497         .padStart(6, "0")
498       const urlPath = giveawayData.customUrl || randomId
499       setGeneratedLink(`https://${baseUrl}/g/${urlPath}`)
500     }
501     setGiveawayCreated(true)
502   }
503 
504   const copyLink = () => {
505     navigator.clipboard.writeText(generatedLink)
506     setLinkCopied(true)
507     setTimeout(() => setLinkCopied(false), 2000)
508   }
509 
510   const resetGiveaway = () => {
511     setGiveawayStep(1)
512     setGiveawayData({
513       method: null,
514       title: "",
515       prize: "",
516       description: "",
517       endDate: "",
518       winners: 1,
519       channel: "",
520       requireMembership: false,
521       requireRole: false,
522       requireAccountAge: false,
523       selectedRole: "",
524       requireLogin: false,
525       customUrl: "",
526     })
527     setGeneratedLink("")
528     setLinkCopied(false)
529     setGiveawayCreated(false)
530   }
531 
532   // Add function to handle moderation level changes
533   const handleModerationLevelChange = (level: "off" | "on" | "lockdown") => {
534     if (!serverConfig) return
535 
536     if (level === "lockdown") {
537       setShowLockdownWarning(true)
538       return // Prevent immediate change, wait for confirmation
539     }
540 
541     const updatedModeration = { ...serverConfig.moderation }
542 
543     if (level === "off") {
544       // Turn everything off
545       Object.keys(updatedModeration).forEach((key) => {
546         if (typeof updatedModeration[key] === "object" && updatedModeration[key]?.enabled !== undefined) {
547           updatedModeration[key].enabled = false
548         }
549       })
550     } else if (level === "on") {
551       // Turn on basic security features
552       updatedModeration.link_filter.enabled = true
553       updatedModeration.bad_word_filter.enabled = true
554       updatedModeration.permission_abuse.enabled = true
555       updatedModeration.malicious_bot_detection.enabled = true
556     }
557 
558     updateServerConfig({
559       moderation_level: level,
560       moderation: updatedModeration,
561     })
562   }
563 
564   const confirmLockdown = () => {
565     if (!serverConfig) return
566     const updatedModeration = { ...serverConfig.moderation }
567     // Turn on all security features
568     Object.keys(updatedModeration).forEach((key) => {
569       if (typeof updatedModeration[key] === "object" && updatedModeration[key]?.enabled !== undefined) {
570         updatedModeration[key].enabled = true
571       }
572     })
573     updateServerConfig({
574       moderation_level: "lockdown",
575       moderation: updatedModeration,
576     })
577     setShowLockdownWarning(false)
578   }
579 
580   const handleSaveBotSettings = async () => {
581     const botProfilePictureUrl = profilePictureUrl // Declare the variable here
582     await updateServerConfig({
583       botProfilePictureUrl,
584       customBotName,
585       botToken,
586     })
587   }
588 
589   const fetchAppSettings = async () => {
590     try {
591       const response = await fetch("/api/app-settings")
592       if (response.ok) {
593         const data = await response.json()
594         setAppSettings(data)
595       }
596     } catch (error) {
597       console.error("Error fetching app settings:", error)
598     }
599   }
600 
601   const handleMaintenanceToggle = async (checked: boolean) => {
602     try {
603       const response = await fetch("/api/app-settings", {
604         method: "PUT",
605         headers: {
606           "Content-Type": "application/json",
607         },
608         body: JSON.stringify({
609           maintenanceMode: {
610             enabled: checked,
611             estimatedTime: checked ? "30 minutes" : "", // Default estimate
612           },
613         }),
614       })
615       if (response.ok) {
616         const data = await response.json()
617         setAppSettings(data)
618       }
619     } catch (error) {
620       console.error("Error updating app settings:", error)
621     }
622   }
623 
624   const fetchAnnouncements = async () => {
625     try {
626       const response = await fetch("/api/announcements")
627       if (response.ok) {
628         const data = await response.json()
629         setAnnouncements(data.announcements)
630       }
631     } catch (error) {
632       console.error("Error fetching announcements:", error)
633     }
634   }
635 
636   const handleSendAnnouncement = async () => {
637     if (!newAnnouncement.trim()) return
638 
639     try {
640       const response = await fetch("/api/announcements", {
641         method: "POST",
642         headers: {
643           "Content-Type": "application/json",
644         },
645         body: JSON.stringify({ message: newAnnouncement }),
646       })
647       if (response.ok) {
648         setNewAnnouncement("")
649         fetchAnnouncements() // Refresh announcements
650       }
651     } catch (error) {
652       console.error("Error sending announcement:", error)
653     }
654   }
655 
656   const handleDismissAnnouncement = (id: string) => {
657     setDismissedAnnouncements((prev) => [...prev, id])
658     // In a real app, you might persist this to user settings in DB
659   }
660 
661   const fetchServerConfig = async () => {
662     try {
663       const response = await fetch(`/api/settings/${serverId}`)
664       if (response.ok) {
665         const data = await response.json()
666         setServerConfig(data)
667       }
668     } catch (error) {
669       console.error("Error fetching server config:", error)
670       toast.error("Failed to load server configuration")
671     } finally {
672       setLoading(false)
673     }
674   }
675 
676   const saveConfig = async () => {
677     if (!serverConfig) return
678 
679     setSaving(true)
680     try {
681       const response = await fetch(`/api/settings/${serverId}`, {
682         method: "POST",
683         headers: { "Content-Type": "application/json" },
684         body: JSON.stringify(serverConfig),
685       })
686 
687       if (response.ok) {
688         toast.success("Configuration saved successfully!")
689       } else {
690         throw new Error("Failed to save configuration")
691       }
692     } catch (error) {
693       console.error("Error saving config:", error)
694       toast.error("Failed to save configuration")
695     } finally {
696       setSaving(false)
697     }
698   }
699 
700   const downloadUserData = async () => {
701     try {
702       const response = await fetch(`/api/user-config/${serverId}`)
703       if (response.ok) {
704         const data = await response.json()
705         setUserData(data)
706 
707         // Create and download JSON file
708         const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
709         const url = URL.createObjectURL(blob)
710         const a = document.createElement("a")
711         a.href = url
712         a.download = `user-data-${serverId}.json`
713         document.body.appendChild(a)
714         a.click()
715         document.body.removeChild(a)
716         URL.revokeObjectURL(url)
717 
718         toast.success("User data downloaded successfully!")
719       }
720     } catch (error) {
721       console.error("Error downloading user data:", error)
722       toast.error("Failed to download user data")
723     }
724   }
725 
726   const renderSupportContent = () => {
727     switch (supportView) {
728       case "staff-insights":
729         return (
730           <div className="space-y-6">
731             <div className="flex items-center gap-2 mb-4">
732               <Button
733                 variant="ghost"
734                 size="sm"
735                 onClick={() => setSupportView("overview")}
736                 className="flex items-center gap-2 text-white hover:bg-gray-100 hover:text-gray-900"
737               >
738                 <ArrowLeft className="h-4 w-4 text-white" />
739                 Back to Overview
740               </Button>
741             </div>
742 
743             <Card className="glass-card">
744               <CardHeader>
745                 <CardTitle className="flex items-center gap-2 text-white">
746                   <BarChart3 className="h-5 w-5" />
747                   Staff Insights Configuration
748                 </CardTitle>
749                 <CardDescription className="text-gray-400">
750                   Monitor staff activity and performance metrics
751                 </CardDescription>
752               </CardHeader>
753               <CardContent className="space-y-4">
754                 <div className="flex items-center justify-between">
755                   <div>
756                     <Label htmlFor="staff-insights" className="text-white">
757                       Enable Staff Insights
758                     </Label>
759                     <p className="text-sm text-gray-400">Track staff activity and generate performance reports</p>
760                   </div>
761                   <Switch
762                     id="staff-insights"
763                     checked={serverConfig.support?.reputation_enabled || false}
764                     onCheckedChange={(checked) =>
765                       updateServerConfig({
766                         support: {
767                           ...serverConfig.support,
768                           reputation_enabled: checked,
769                         },
770                       })
771                     }
772                   />
773                 </div>
774 
775                 <Separator className="bg-white/20" />
776 
777                 <div className="flex items-center justify-between">
778                   <div>
779                     <Label htmlFor="reputation-system" className="text-white">
780                       Reputation System
781                     </Label>
782                     <p className="text-sm text-gray-400">Enable staff reputation tracking and rewards</p>
783                   </div>
784                   <Switch
785                     id="reputation-system"
786                     checked={serverConfig.support?.reputation_enabled || false}
787                     onCheckedChange={(checked) =>
788                       updateServerConfig({
789                         support: {
790                           ...serverConfig.support,
791                           reputation_enabled: checked,
792                         },
793                       })
794                     }
795                   />
796                 </div>
797 
798                 <div className="grid grid-cols-2 gap-4 mt-6">
799                   <Card className="glass-card">
800                     <CardContent className="pt-6">
801                       <div className="flex items-center justify-between">
802                         <div>
803                           <p className="text-sm font-medium text-gray-400">Active Staff</p>
804                           <p className="text-2xl font-bold text-white">12</p>
805                         </div>
806                         <Users className="h-8 w-8 text-gray-400" />
807                       </div>
808                     </CardContent>
809                   </Card>
810 
811                   <Card className="glass-card">
812                     <CardContent className="pt-6">
813                       <div className="flex items-center justify-between">
814                         <div>
815                           <p className="text-sm font-medium text-gray-400">Avg. Response Time</p>
816                           <p className="text-2xl font-bold text-white">2.3m</p>
817                         </div>
818                         <BarChart3 className="h-8 w-8 text-gray-400" />
819                       </div>
820                     </CardContent>
821                   </Card>
822                 </div>
823               </CardContent>
824             </Card>
825           </div>
826         )
827 
828       case "tickets":
829         return (
830           <div className="space-y-6">
831             <div className="flex items-center gap-2 mb-4">
832               <Button
833                 variant="ghost"
834                 size="sm"
835                 onClick={() => setSupportView("overview")}
836                 className="flex items-center gap-2 text-white hover:bg-gray-100 hover:text-gray-900"
837               >
838                 <ArrowLeft className="h-4 w-4 text-white" />
839                 Back to Overview
840               </Button>
841             </div>
842 
843             <Card className="glass-card">
844               <CardHeader>
845                 <CardTitle className="flex items-center gap-2 text-white">
846                   <Ticket className="h-5 w-5" />
847                   Ticket System Configuration
848                 </CardTitle>
849                 <CardDescription className="text-gray-400">Manage support tickets and user inquiries</CardDescription>
850               </CardHeader>
851               <CardContent className="space-y-4">
852                 <div className="flex items-center justify-between">
853                   <div>
854                     <Label htmlFor="ticket-system" className="text-white">
855                       Enable Ticket System
856                     </Label>
857                     <p className="text-sm text-gray-400">Allow users to create support tickets</p>
858                   </div>
859                   <Switch
860                     id="ticket-system"
861                     checked={serverConfig.support?.ticket_system?.enabled || false}
862                     onCheckedChange={(checked) =>
863                       updateServerConfig({
864                         support: {
865                           ...serverConfig.support,
866                           ticket_system: {
867                             ...serverConfig.support?.ticket_system,
868                             enabled: checked,
869                             embed: serverConfig.support?.ticket_system?.embed || {
870                               title: "Support Ticket",
871                               description: "Click the button below to create a support ticket.",
872                               color: "#5865F2",
873                               footer: "Support Team",
874                             },
875                             settings: serverConfig.support?.ticket_system?.settings || {
876                               autoAnswer: { enabled: false, qa_pairs: "" },
877                               blockedUsers: { enabled: false, userIds: [] },
878                               inactivityClose: { enabled: false, timeoutMinutes: 30 },
879                               logging: { enabled: false },
880                             },
881                           },
882                         },
883                       })
884                     }
885                   />
886                 </div>
887 
888                 <Separator className="bg-white/20" />
889 
890                 <div className="space-y-2">
891                   <Label htmlFor="ticket-category" className="text-white">
892                     Ticket Category ID
893                   </Label>
894                   <Input
895                     id="ticket-category"
896                     placeholder="Enter Discord category ID"
897                     value={serverConfig.support?.ticket_system?.channel_id || ""}
898                     onChange={(e) =>
899                       updateServerConfig({
900                         support: {
901                           ...serverConfig.support,
902                           ticket_system: { ...serverConfig.support.ticket_system, channel_id: e.target.value },
903                         },
904                       })
905                     }
906                     className="bg-black/60 border-white/20 text-white placeholder-gray-400"
907                   />
908                   <p className="text-sm text-gray-400">Discord category where ticket channels will be created</p>
909                 </div>
910 
911                 <div className="grid grid-cols-3 gap-4 mt-6">
912                   <Card className="glass-card">
913                     <CardContent className="pt-6">
914                       <div className="flex items-center justify-between">
915                         <div>
916                           <p className="text-sm font-medium text-gray-400">Open Tickets</p>
917                           <p className="text-2xl font-bold text-white">8</p>
918                         </div>
919                         <AlertCircle className="h-8 w-8 text-yellow-500" />
920                       </div>
921                     </CardContent>
922                   </Card>
923 
924                   <Card className="glass-card">
925                     <CardContent className="pt-6">
926                       <div className="flex items-center justify-between">
927                         <div>
928                           <p className="text-sm font-medium text-gray-400">Resolved Today</p>
929                           <p className="text-2xl font-bold text-white">15</p>
930                         </div>
931                         <CheckCircle className="h-8 w-8 text-green-500" />
932                       </div>
933                     </CardContent>
934                   </Card>
935 
936                   <Card className="glass-card">
937                     <CardContent className="pt-6">
938                       <div className="flex items-center justify-between">
939                         <div>
940                           <p className="text-sm font-medium text-gray-400">Total This Week</p>
941                           <p className="text-2xl font-bold text-white">47</p>
942                         </div>
943                         <Ticket className="h-8 w-8 text-gray-400" />
944                       </div>
945                     </CardContent>
946                   </Card>
947                 </div>
948               </CardContent>
949             </Card>
950           </div>
951         )
952 
953       default:
954         return (
955           <div className="space-y-6">
956             <div className="grid grid-cols-1 gap-6">
957               {" "}
958               {/* Changed to grid-cols-1 for vertical stacking */}
959               <Card
960                 className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
961                 onClick={() => setActiveSupportSection("staff")}
962               >
963                 <CardContent className="p-6">
964                   <div className="flex items-center space-x-4 mb-4">
965                     <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
966                       <Users className="h-6 w-6 text-white" />
967                     </div>
968                     <div>
969                       <h3 className="text-lg font-semibold text-white">Staff Insights</h3>
970                       <p className="text-sm text-gray-400">Monitor staff performance and reputation</p>
971                     </div>
972                   </div>
973                   <div className="space-y-2">
974                     <div className="flex justify-between text-sm">
975                       <span className="text-gray-400">Status:</span>
976                       <span
977                         className={`${serverConfig.support?.reputation_enabled ? "text-green-400" : "text-gray-400"}`}
978                       >
979                         {serverConfig.support?.reputation_enabled ? "Enabled" : "Disabled"}
980                       </span>
981                     </div>
982                     <div className="flex justify-between text-sm">
983                       <span className="text-gray-400">Active Staff:</span>
984                       <span className="text-white">{serverConfig.support?.staff?.length || 0}</span>
985                     </div>
986                   </div>
987                 </CardContent>
988               </Card>
989               <Card
990                 className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
991                 onClick={() => setActiveSupportSection("tickets")}
992               >
993                 <CardContent className="p-6">
994                   <div className="flex items-center space-x-4 mb-4">
995                     <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
996                       <MessageSquare className="h-6 w-6 text-white" />
997                     </div>
998                     <div>
999                       <h3 className="text-lg font-semibold text-white">Ticket System</h3>
1000                       <p className="text-sm text-gray-400">Configure support tickets and embeds</p>
1001                     </div>
1002                   </div>
1003                   <div className="space-y-2">
1004                     <div className="flex justify-between text-sm">
1005                       <span className="text-gray-400">Status:</span>
1006                       <span
1007                         className={`${serverConfig.support?.ticket_system?.enabled ? "text-green-400" : "text-gray-400"}`}
1008                       >
1009                         {serverConfig.support?.ticket_system?.enabled ? "Active" : "Inactive"}
1010                       </span>
1011                     </div>
1012                     <div className="flex justify-between text-sm">
1013                       <span className="text-gray-400">Channel:</span>
1014                       <span className="text-white">
1015                         {serverConfig.support?.ticket_system?.channel_id
1016                           ? getChannelName(serverConfig.support.ticket_system.channel_id)
1017                           : "Not set"}
1018                       </span>
1019                     </div>
1020                   </div>
1021                 </CardContent>
1022               </Card>
1023             </div>
1024           </div>
1025         )
1026     }
1027   }
1028 
1029   const renderEventContent = () => {
1030     switch (activeEventSection) {
1031       case "automatic-task":
1032         return (
1033           <div className="space-y-6">
1034             <Button
1035               variant="ghost"
1036               onClick={() => setActiveEventSection("overview")}
1037               className="text-white hover:bg-gray-100 hover:text-gray-900"
1038             >
1039               <ArrowLeft className="h-4 w-4 mr-2 text-white" /> Back to Overview
1040             </Button>
1041             <Card className="glass-card">
1042               <CardHeader>
1043                 <CardTitle className="text-white flex items-center text-xl">
1044                   <Clock className="h-6 w-6 text-white mr-3" /> Automatic Tasks
1045                 </CardTitle>
1046                 <CardDescription className="text-gray-400">
1047                   Automate actions and schedule tasks for your server.
1048                 </CardDescription>
1049               </CardHeader>
1050               <CardContent className="space-y-4">
1051                 <div className="flex items-center justify-between">
1052                   <div>
1053                     <Label htmlFor="auto-tasks" className="text-white">
1054                       Enable Automatic Tasks
1055                     </Label>
1056                     <p className="text-sm text-gray-400">Enable scheduled tasks and automated actions.</p>
1057                   </div>
1058                   <Switch
1059                     id="auto-tasks"
1060                     checked={serverConfig.automatic_tasks?.enabled || false}
1061                     onCheckedChange={(checked) =>
1062                       updateServerConfig({
1063                         automatic_tasks: { ...serverConfig.automatic_tasks, enabled: checked },
1064                       })
1065                     }
1066                   />
1067                 </div>
1068                 <Separator className="bg-white/20" />
1069                 {serverConfig.automatic_tasks?.enabled && (
1070                   <div className="space-y-4">
1071                     <h4 className="text-white font-medium">Scheduled Tasks</h4>
1072                     {serverConfig.automatic_tasks.tasks?.length > 0 ? (
1073                       <div className="space-y-2">
1074                         {serverConfig.automatic_tasks.tasks.map((task) => (
1075                           <div
1076                             key={task.id}
1077                             className="flex items-center justify-between p-3 rounded-md bg-black/20 border border-white/10"
1078                           >
1079                             <span className="text-white">{task.name}</span>
1080                             <Badge variant="secondary" className="bg-gray-100 text-gray-900">
1081                               {task.status}
1082                             </Badge>
1083                           </div>
1084                         ))}
1085                       </div>
1086                     ) : (
1087                       <p className="text-gray-400 text-sm">No automatic tasks configured yet.</p>
1088                     )}
1089                     <Button
1090                       variant="outline"
1091                       className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
1092                     >
1093                       <Plus className="h-4 w-4 mr-2 text-white" /> Add New Task
1094                     </Button>
1095                   </div>
1096                 )}
1097               </CardContent>
1098             </Card>
1099           </div>
1100         )
1101       case "giveaway":
1102         return (
1103           <div className="space-y-6">
1104             <Button
1105               variant="ghost"
1106               onClick={() => setActiveEventSection("overview")}
1107               className="text-white hover:bg-gray-100 hover:text-gray-900"
1108             >
1109               <ArrowLeft className="h-4 w-4 mr-2 text-white" /> Back to Overview
1110             </Button>
1111             <Card className="glass-card">
1112               <CardHeader>
1113                 <CardTitle className="text-white flex items-center text-xl">
1114                   <Gift className="h-6 w-6 text-white mr-3" /> Giveaway System
1115                 </CardTitle>
1116                 <CardDescription className="text-gray-400">
1117                   Configure and manage giveaways for your server
1118                 </CardDescription>
1119               </CardHeader>
1120               <CardContent className="space-y-6">
1121                 {giveawayStep === 1 && (
1122                   <div className="space-y-4">
1123                     <h3 className="text-lg font-medium text-white">Step 1: Select Giveaway Method</h3>
1124                     <p className="text-gray-400">Choose how you want to create the giveaway</p>
1125                     <div className="flex space-x-4">
1126                       <Button
1127                         onClick={() => handleMethodSelect("server")}
1128                         className="bg-white text-black hover:bg-gray-100"
1129                       >
1130                         Create on Server
1131                       </Button>
1132                       <Button
1133                         onClick={() => handleMethodSelect("link")}
1134                         className="bg-white text-black hover:bg-gray-100"
1135                       >
1136                         Create with Link
1137                       </Button>
1138                     </div>
1139                   </div>
1140                 )}
1141 
1142                 {giveawayStep === 2 && (
1143                   <div className="space-y-4">
1144                     <h3 className="text-lg font-medium text-white">Step 2: Configure Giveaway</h3>
1145                     <p className="text-gray-400">Enter the details for your giveaway</p>
1146                     <div className="space-y-3">
1147                       <div>
1148                         <Label className="text-white text-sm mb-2 block">Title</Label>
1149                         <Input
1150                           placeholder="Summer Giveaway"
1151                           value={giveawayData.title}
1152                           onChange={(e) => setGiveawayData({ ...giveawayData, title: e.target.value })}
1153                           className="bg-black/60 border-white/20 text-white placeholder-gray-400"
1154                         />
1155                       </div>
1156                       <div>
1157                         <Label className="text-white text-sm mb-2 block">Prize</Label>
1158                         <Input
1159                           placeholder="Gaming PC"
1160                           value={giveawayData.prize}
1161                           onChange={(e) => setGiveawayData({ ...giveawayData, prize: e.target.value })}
1162                           className="bg-black/60 border-white/20 text-white placeholder-gray-400"
1163                         />
1164                       </div>
1165                       <div>
1166                         <Label className="text-white text-sm mb-2 block">Description</Label>
1167                         <Textarea
1168                           placeholder="Enter the description for the giveaway"
1169                           value={giveawayData.description}
1170                           onChange={(e) => setGiveawayData({ ...giveawayData, description: e.target.value })}
1171                           className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[80px]"
1172                         />
1173                       </div>
1174                       <div>
1175                         <Label className="text-white text-sm mb-2 block">End Date</Label>
1176                         <Input
1177                           type="datetime-local"
1178                           value={giveawayData.endDate}
1179                           onChange={(e) => setGiveawayData({ ...giveawayData, endDate: e.target.value })}
1180                           className="bg-black/60 border-white/20 text-white placeholder-gray-400"
1181                         />
1182                       </div>
1183                       <div>
1184                         <Label className="text-white text-sm mb-2 block">Number of Winners</Label>
1185                         <Input
1186                           type="number"
1187                           min="1"
1188                           value={giveawayData.winners}
1189                           onChange={(e) =>
1190                             setGiveawayData({ ...giveawayData, winners: Number.parseInt(e.target.value) })
1191                           }
1192                           className="bg-black/60 border-white/20 text-white placeholder-gray-400"
1193                         />
1194                       </div>
1195                       {giveawayData.method === "server" && (
1196                         <div>
1197                           <Label className="text-white text-sm mb-2 block">Channel</Label>
1198                           <Select
1199                             value={giveawayData.channel}
1200                             onValueChange={(value) => setGiveawayData({ ...giveawayData, channel: value })}
1201                           >
1202                             <SelectTrigger className="bg-black/60 border-white/20 h-8">
1203                               <SelectValue placeholder="Select a channel" />
1204                             </SelectTrigger>
1205                             <SelectContent>
1206                               {serverConfig.channels &&
1207                                 Object.entries(serverConfig.channels).map(([channelId, channelName]) => (
1208                                   <SelectItem key={channelId} value={channelId}>
1209                                     {channelName}
1210                                   </SelectItem>
1211                                 ))}
1212                             </SelectContent>
1213                           </Select>
1214                         </div>
1215                       )}
1216                       {giveawayData.method === "link" && (
1217                         <div>
1218                           <Label className="text-white text-sm mb-2 block">Custom URL (Optional)</Label>
1219                           <Input
1220                             placeholder="custom-giveaway-url"
1221                             value={giveawayData.customUrl}
1222                             onChange={(e) => setGiveawayData({ ...giveawayData, customUrl: e.target.value })}
1223                             className="bg-black/60 border-white/20 text-white placeholder-gray-400"
1224                           />
1225                         </div>
1226                       )}
1227                     </div>
1228                     <div className="flex justify-between">
1229                       <Button
1230                         variant="outline"
1231                         onClick={handlePrevStep}
1232                         className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
1233                       >
1234                         <ArrowLeft className="h-4 w-4 mr-2 text-white" />
1235                         Previous
1236                       </Button>
1237                       <Button onClick={handleNextStep} className="bg-white text-black hover:bg-gray-100">
1238                         Next
1239                       </Button>
1240                     </div>
1241                   </div>
1242                 )}
1243 
1244                 {giveawayStep === 3 && (
1245                   <div className="space-y-4">
1246                     <h3 className="text-lg font-medium text-white">Step 3: Set Requirements</h3>
1247                     <p className="text-gray-400">Set the requirements for users to enter the giveaway</p>
1248                     <div className="space-y-3">
1249                       <div className="flex items-center justify-between">
1250                         <div>
1251                           <Label className="text-white text-sm">Require Server Membership</Label>
1252                           <p className="text-xs text-gray-400">Users must be a member of the server</p>
1253                         </div>
1254                         <Switch
1255                           checked={giveawayData.requireMembership}
1256                           onCheckedChange={(checked) =>
1257                             setGiveawayData({ ...giveawayData, requireMembership: checked })
1258                           }
1259                         />
1260                       </div>
1261                       <div className="flex items-center justify-between">
1262                         <div>
1263                           <Label className="text-white text-sm">Require Specific Role</Label>
1264                           <p className="text-xs text-gray-400">Users must have a specific role</p>
1265                         </div>
1266                         <Switch
1267                           checked={giveawayData.requireRole}
1268                           onCheckedChange={(checked) => setGiveawayData({ ...giveawayData, requireRole: checked })}
1269                         />
1270                       </div>
1271                       {giveawayData.requireRole && (
1272                         <div>
1273                           <Label className="text-white text-sm mb-2 block">Select Role</Label>
1274                           <Select
1275                             value={giveawayData.selectedRole}
1276                             onValueChange={(value) => setGiveawayData({ ...giveawayData, selectedRole: value })}
1277                           >
1278                             <SelectTrigger className="bg-black/60 border-white/20 h-8">
1279                               <SelectValue placeholder="Select a role" />
1280                             </SelectTrigger>
1281                             <SelectContent>
1282                               {serverConfig.roles_and_names &&
1283                                 Object.entries(serverConfig.roles_and_names).map(([roleId, roleName]) => (
1284                                   <SelectItem key={roleId} value={roleId}>
1285                                     {roleName}
1286                                   </SelectItem>
1287                                 ))}
1288                             </SelectContent>
1289                           </Select>
1290                         </div>
1291                       )}
1292                       <div className="flex items-center justify-between">
1293                         <div>
1294                           <Label className="text-white text-sm">Require Account Age</Label>
1295                           <p className="text-xs text-gray-400">Users must have an account older than a certain age</p>
1296                         </div>
1297                         <Switch
1298                           checked={giveawayData.requireAccountAge}
1299                           onCheckedChange={(checked) =>
1300                             setGiveawayData({ ...giveawayData, requireAccountAge: checked })
1301                           }
1302                         />
1303                       </div>
1304                       <div className="flex items-center justify-between">
1305                         <div>
1306                           <Label className="text-white text-sm">Require Login</Label>
1307                           <p className="text-xs text-gray-400">Users must login to enter</p>
1308                         </div>
1309                         <Switch
1310                           checked={giveawayData.requireLogin}
1311                           onCheckedChange={(checked) => setGiveawayData({ ...giveawayData, requireLogin: checked })}
1312                         />
1313                       </div>
1314                     </div>
1315                     <div className="flex justify-between">
1316                       <Button
1317                         variant="outline"
1318                         onClick={handlePrevStep}
1319                         className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
1320                       >
1321                         <ArrowLeft className="h-4 w-4 mr-2 text-white" />
1322                         Previous
1323                       </Button>
1324                       <Button onClick={handleCreateGiveaway} className="bg-white text-black hover:bg-gray-100">
1325                         Create Giveaway
1326                       </Button>
1327                     </div>
1328                   </div>
1329                 )}
1330 
1331                 {giveawayCreated && (
1332                   <div className="space-y-4">
1333                     <h3 className="text-lg font-medium text-white">Giveaway Created!</h3>
1334                     {giveawayData.method === "link" && (
1335                       <div className="space-y-2">
1336                         <p className="text-gray-400">Share this link with your community:</p>
1337                         <div className="flex items-center justify-between bg-black/60 border-white/20 rounded-md p-2">
1338                           <Input readOnly value={generatedLink} className="bg-transparent border-none text-white" />
1339                           <Button onClick={copyLink} className="bg-white text-black hover:bg-gray-100">
1340                             {linkCopied ? (
1341                               <Check className="h-4 w-4 text-white" />
1342                             ) : (
1343                               <Copy className="h-4 w-4 text-white" />
1344                             )}
1345                           </Button>
1346                         </div>
1347                       </div>
1348                     )}
1349                     <Button onClick={resetGiveaway} className="bg-gray-100 text-gray-900 hover:bg-gray-200">
1350                       Create Another Giveaway
1351                     </Button>
1352                   </div>
1353                 )}
1354               </CardContent>
1355             </Card>
1356           </div>
1357         )
1358       case "logger":
1359         return (
1360           <div className="space-y-6">
1361             <Button
1362               variant="ghost"
1363               onClick={() => setActiveEventSection("overview")}
1364               className="text-white hover:bg-gray-100 hover:text-gray-900"
1365             >
1366               <ArrowLeft className="h-4 w-4 mr-2 text-white" /> Back to Overview
1367             </Button>
1368             <Card className="glass-card">
1369               <CardHeader>
1370                 <CardTitle className="text-white flex items-center text-xl">
1371                   <FileText className="h-6 w-6 text-white mr-3" /> Logger
1372                 </CardTitle>
1373                 <CardDescription className="text-gray-400">
1374                   Configure logging for server events and actions.
1375                 </CardDescription>
1376               </CardHeader>
1377               <CardContent className="space-y-4">
1378                 <div className="flex items-center justify-between">
1379                   <div>
1380                     <Label htmlFor="logger-enabled" className="text-white">
1381                       Enable Logger
1382                     </Label>
1383                     <p className="text-sm text-gray-400">Log various server events to a designated channel.</p>
1384                   </div>
1385                   <Switch
1386                     id="logger-enabled"
1387                     checked={serverConfig.logs?.enabled || false}
1388                     onCheckedChange={(checked) =>
1389                       updateServerConfig({
1390                         logs: { ...serverConfig.logs, enabled: checked },
1391                       })
1392                     }
1393                   />
1394                 </div>
1395                 <Separator className="bg-white/20" />
1396                 {serverConfig.logs?.enabled && (
1397                   <div className="space-y-4">
1398                     <div>
1399                       <Label className="text-white text-sm mb-2 block">Log Channel</Label>
1400                       <Select
1401                         value={serverConfig.logs?.channel_id || ""}
1402                         onValueChange={(value) =>
1403                           updateServerConfig({
1404                             logs: { ...serverConfig.logs, channel_id: value },
1405                           })
1406                         }
1407                       >
1408                         <SelectTrigger className="bg-black/60 border-white/20 h-8">
1409                           <SelectValue placeholder="Select a channel" />
1410                         </SelectTrigger>
1411                         <SelectContent>
1412                           {serverConfig.channels &&
1413                             Object.entries(serverConfig.channels).map(([channelId, channelName]) => (
1414                               <SelectItem key={channelId} value={channelId}>
1415                                 {channelName}
1416                               </SelectItem>
1417                             ))}
1418                         </SelectContent>
1419                       </Select>
1420                     </div>
1421                     <div className="space-y-2">
1422                       <h4 className="text-white font-medium">Events to Log</h4>
1423                       <div className="flex items-center justify-between">
1424                         <Label htmlFor="log-message-edits" className="text-white text-sm">
1425                           Message Edits
1426                         </Label>
1427                         <Switch
1428                           id="log-message-edits"
1429                           checked={serverConfig.logs?.message_edits || false}
1430                           onCheckedChange={(checked) =>
1431                             updateServerConfig({
1432                               logs: { ...serverConfig.logs, message_edits: checked },
1433                             })
1434                           }
1435                         />
1436                       </div>
1437                       <div className="flex items-center justify-between">
1438                         <Label htmlFor="log-mod-actions" className="text-white text-sm">
1439                           Moderation Actions
1440                         </Label>
1441                         <Switch
1442                           id="log-mod-actions"
1443                           checked={serverConfig.logs?.mod_actions || false}
1444                           onCheckedChange={(checked) =>
1445                             updateServerConfig({
1446                               logs: { ...serverConfig.logs, mod_actions: checked },
1447                             })
1448                           }
1449                         />
1450                       </div>
1451                       <div className="flex items-center justify-between">
1452                         <Label htmlFor="log-member-joins" className="text-white text-sm">
1453                           Member Joins
1454                         </Label>
1455                         <Switch
1456                           id="log-member-joins"
1457                           checked={serverConfig.logs?.member_joins || false}
1458                           onCheckedChange={(checked) =>
1459                             updateServerConfig({
1460                               logs: { ...serverConfig.logs, member_joins: checked },
1461                             })
1462                           }
1463                         />
1464                       </div>
1465                       <div className="flex items-center justify-between">
1466                         <Label htmlFor="log-member-leaves" className="text-white text-sm">
1467                           Member Leaves
1468                         </Label>
1469                         <Switch
1470                           id="log-member-leaves"
1471                           checked={serverConfig.logs?.member_leaves || false}
1472                           onCheckedChange={(checked) =>
1473                             updateServerConfig({
1474                               logs: { ...serverConfig.logs, member_leaves: checked },
1475                             })
1476                           }
1477                         />
1478                       </div>
1479                     </div>
1480                   </div>
1481                 )}
1482               </CardContent>
1483             </Card>
1484           </div>
1485         )
1486       case "invite-track":
1487         return (
1488           <div className="space-y-6">
1489             <Button
1490               variant="ghost"
1491               onClick={() => setActiveEventSection("overview")}
1492               className="text-white hover:bg-gray-100 hover:text-gray-900"
1493             >
1494               <ArrowLeft className="h-4 w-4 mr-2 text-white" /> Back to Overview
1495             </Button>
1496             <Card className="glass-card">
1497               <CardHeader>
1498                 <CardTitle className="text-white flex items-center text-xl">
1499                   <LinkIcon className="h-6 w-6 text-white mr-3" /> Invite Tracker
1500                 </CardTitle>
1501                 <CardDescription className="text-gray-400">Track invites and monitor server growth.</CardDescription>
1502               </CardHeader>
1503               <CardContent className="space-y-4">
1504                 <div className="flex items-center justify-between">
1505                   <div>
1506                     <Label htmlFor="invite-track-enabled" className="text-white">
1507                       Enable Invite Tracker
1508                     </Label>
1509                     <p className="text-sm text-gray-400">Track which invites members use to join your server.</p>
1510                   </div>
1511                   <Switch
1512                     id="invite-track-enabled"
1513                     checked={serverConfig.invite_tracking?.enabled || false}
1514                     onCheckedChange={(checked) =>
1515                       updateServerConfig({
1516                         invite_tracking: { ...serverConfig.invite_tracking, enabled: checked },
1517                       })
1518                     }
1519                   />
1520                 </div>
1521                 <Separator className="bg-white/20" />
1522                 {serverConfig.invite_tracking?.enabled && (
1523                   <div className="space-y-4">
1524                     <div>
1525                       <Label className="text-white text-sm mb-2 block">Invite Log Channel</Label>
1526                       <Select
1527                         value={serverConfig.invite_tracking?.channel_id || ""}
1528                         onValueChange={(value) =>
1529                           updateServerConfig({
1530                             invite_tracking: { ...serverConfig.invite_tracking, channel_id: value },
1531                           })
1532                         }
1533                       >
1534                         <SelectTrigger className="bg-black/60 border-white/20 h-8">
1535                           <SelectValue placeholder="Select a channel" />
1536                         </SelectTrigger>
1537                         <SelectContent>
1538                           {serverConfig.channels &&
1539                             Object.entries(serverConfig.channels).map(([channelId, channelName]) => (
1540                               <SelectItem key={channelId} value={channelId}>
1541                                 {channelName}
1542                               </SelectItem>
1543                             ))}
1544                         </SelectContent>
1545                       </Select>
1546                     </div>
1547                     <div className="space-y-2">
1548                       <h4 className="text-white font-medium">Events to Track</h4>
1549                       <div className="flex items-center justify-between">
1550                         <Label htmlFor="track-joins" className="text-white text-sm">
1551                           Track Joins
1552                         </Label>
1553                         <Switch
1554                           id="track-joins"
1555                           checked={serverConfig.invite_tracking?.track_joins || false}
1556                           onCheckedChange={(checked) =>
1557                             updateServerConfig({
1558                               invite_tracking: { ...serverConfig.invite_tracking, track_joins: checked },
1559                             })
1560                           }
1561                         />
1562                       </div>
1563                       <div className="flex items-center justify-between">
1564                         <Label htmlFor="track-leaves" className="text-white text-sm">
1565                           Track Leaves
1566                         </Label>
1567                         <Switch
1568                           id="track-leaves"
1569                           checked={serverConfig.invite_tracking?.track_leaves || false}
1570                           onCheckedChange={(checked) =>
1571                             updateServerConfig({
1572                               invite_tracking: { ...serverConfig.invite_tracking, track_leaves: checked },
1573                             })
1574                           }
1575                         />
1576                       </div>
1577                     </div>
1578                   </div>
1579                 )}
1580               </CardContent>
1581             </Card>
1582           </div>
1583         )
1584       default:
1585         return (
1586           <div className="space-y-6">
1587             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
1588               {/* Automatic Task Card */}
1589               <Card
1590                 className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
1591                 onClick={() => setActiveEventSection("automatic-task")}
1592               >
1593                 <CardContent className="p-6">
1594                   <div className="flex items-center space-x-4 mb-4">
1595                     <div className="w-12 h-12 rounded-lg bg-gray-700/20 flex items-center justify-center">
1596                       <Clock className="h-6 w-6 text-white" />
1597                     </div>
1598                     <div>
1599                       <h3 className="text-lg font-semibold text-white">Automatic Tasks</h3>
1600                       <p className="text-sm text-gray-400">Automate actions and schedule tasks</p>
1601                     </div>
1602                   </div>
1603                   <div className="space-y-2">
1604                     <div className="flex justify-between text-sm">
1605                       <span className="text-gray-400">Status:</span>
1606                       <span className={`${serverConfig.automatic_tasks?.enabled ? "text-green-400" : "text-gray-400"}`}>
1607                         {serverConfig.automatic_tasks?.enabled ? "Enabled" : "Disabled"}
1608                       </span>
1609                     </div>
1610                     <div className="flex justify-between text-sm">
1611                       <span className="text-gray-400">Active Tasks:</span>
1612                       <span className="text-white">{serverConfig.automatic_tasks?.tasks?.length || 0}</span>
1613                     </div>
1614                   </div>
1615                 </CardContent>
1616               </Card>
1617 
1618               {/* Giveaway Card */}
1619               <Card
1620                 className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
1621                 onClick={() => setActiveEventSection("giveaway")}
1622               >
1623                 <CardContent className="p-6">
1624                   <div className="flex items-center space-x-4 mb-4">
1625                     <div className="w-12 h-12 rounded-lg bg-gray-700/20 flex items-center justify-center">
1626                       <Gift className="h-6 w-6 text-white" />
1627                     </div>
1628                     <div>
1629                       <h3 className="text-lg font-semibold text-white">Giveaway System</h3>
1630                       <p className="text-sm text-gray-400">Configure and manage giveaways</p>
1631                     </div>
1632                   </div>
1633                   <div className="space-y-2">
1634                     <div className="flex justify-between text-sm">
1635                       <span className="text-gray-400">Status:</span>
1636                       <span className={`${serverConfig.giveaway?.enabled ? "text-green-400" : "text-gray-400"}`}>
1637                         {serverConfig.giveaway?.enabled ? "Enabled" : "Disabled"}
1638                       </span>
1639                     </div>
1640                     <div className="flex justify-between text-sm">
1641                       <span className="text-gray-400">Ongoing Giveaways:</span>
1642                       <span className="text-white">3</span> {/* Placeholder */}
1643                     </div>
1644                   </div>
1645                 </CardContent>
1646               </Card>
1647 
1648               {/* Logger Card */}
1649               <Card
1650                 className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
1651                 onClick={() => setActiveEventSection("logger")}
1652               >
1653                 <CardContent className="p-6">
1654                   <div className="flex items-center space-x-4 mb-4">
1655                     <div className="w-12 h-12 rounded-lg bg-gray-700/20 flex items-center justify-center">
1656                       <FileText className="h-6 w-6 text-white" />
1657                     </div>
1658                     <div>
1659                       <h3 className="text-lg font-semibold text-white">Logger</h3>
1660                       <p className="text-sm text-gray-400">Log server events and actions</p>
1661                     </div>
1662                   </div>
1663                   <div className="space-y-2">
1664                     <div className="flex justify-between text-sm">
1665                       <span className="text-gray-400">Status:</span>
1666                       <span className={`${serverConfig.logs?.enabled ? "text-green-400" : "text-gray-400"}`}>
1667                         {serverConfig.logs?.enabled ? "Enabled" : "Disabled"}
1668                       </span>
1669                     </div>
1670                     <div className="flex justify-between text-sm">
1671                       <span className="text-gray-400">Log Entries Today:</span>
1672                       <span className="text-white">124</span> {/* Placeholder */}
1673                     </div>
1674                   </div>
1675                 </CardContent>
1676               </Card>
1677 
1678               {/* Invite Tracker Card */}
1679               <Card
1680                 className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
1681                 onClick={() => setActiveEventSection("invite-track")}
1682               >
1683                 <CardContent className="p-6">
1684                   <div className="flex items-center space-x-4 mb-4">
1685                     <div className="w-12 h-12 rounded-lg bg-gray-700/20 flex items-center justify-center">
1686                       <LinkIcon className="h-6 w-6 text-white" />
1687                     </div>
1688                     <div>
1689                       <h3 className="text-lg font-semibold text-white">Invite Tracker</h3>
1690                       <p className="text-sm text-gray-400">Track invites and monitor server growth</p>
1691                     </div>
1692                   </div>
1693                   <div className="space-y-2">
1694                     <div className="flex justify-between text-sm">
1695                       <span className="text-gray-400">Status:</span>
1696                       <span className={`${serverConfig.invite_tracking?.enabled ? "text-green-400" : "text-gray-400"}`}>
1697                         {serverConfig.invite_tracking?.enabled ? "Enabled" : "Disabled"}
1698                       </span>
1699                     </div>
1700                     <div className="flex justify-between text-sm">
1701                       <span className="text-gray-400">Active Invites:</span>
1702                       <span className="text-white">7</span> {/* Placeholder */}
1703                     </div>
1704                   </div>
1705                 </CardContent>
1706               </Card>
1707             </div>
1708           </div>
1709         )
1710     }
1711   }
1712 
1713   if (status === "loading" || loading) {
1714     return (
1715       <div className="min-h-screen bg-black flex items-center justify-center">
1716         <div className="text-center">
1717           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
1718           <p className="text-white">Loading server configuration...</p>
1719         </div>
1720       </div>
1721     )
1722   }
1723 
1724   if (!session || !serverConfig) {
1725     return null
1726   }
1727 
1728   // Bot not added to server - show waiting state
1729   if (!serverConfig.is_bot_added) {
1730     return (
1731       <div className="min-h-screen bg-black text-white">
1732         <header className="glass-card border-b border-white/10">
1733           <div className="container mx-auto px-4 py-4">
1734             <div className="flex items-center justify-between">
1735               <div className="flex items-center space-x-3">
1736                 <Link href="/dashboard">
1737                   <Button variant="ghost" size="icon" className="text-white hover:bg-gray-100 hover:text-gray-900">
1738                     <ArrowLeft className="h-5 w-5" />
1739                   </Button>
1740                 </Link>
1741                 <Image src="/new-blue-logo.png" alt="Sycord Bot" width={28} height={28} className="rounded-lg" />
1742                 <div>
1743                   <h1 className="text-lg font-bold text-white">
1744                     <span className="text-white">Sycord</span>
1745                   </h1>
1746                 </div>
1747               </div>
1748               <DropdownMenu>
1749                 <DropdownMenuTrigger asChild>
1750                   <Button
1751                     variant="outline"
1752                     className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
1753                   >
1754                     <div className="flex items-center space-x-2">
1755                       <div className="w-5 h-5 bg-gray-600 rounded"></div>
1756                       <span className="truncate max-w-32">{serverConfig.server_name}</span>
1757                       <ChevronDown className="h-4 w-4" />
1758                     </div>
1759                   </Button>
1760                 </DropdownMenuTrigger>
1761                 <DropdownMenuContent align="end" className="w-64">
1762                   {userServers.map((server) => (
1763                     <DropdownMenuItem key={server.serverId} asChild>
1764                       <Link href={`/dashboard/server/${server.serverId}`}>
1765                         <div className="flex items-center space-x-2 w-full">
1766                           <div className="w-5 h-5 bg-gray-600 rounded"></div>
1767                           <span className="truncate">{server.serverName}</span>
1768                         </div>
1769                       </Link>
1770                     </DropdownMenuItem>
1771                   ))}
1772                 </DropdownMenuContent>
1773               </DropdownMenu>
1774             </div>
1775           </div>
1776         </header>
1777 
1778         <div className="container mx-auto px-4 py-8">
1779           <Card className="glass-card max-w-2xl mx-auto">
1780             <CardContent className="p-8 md:p-12 text-center">
1781               <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto mb-6">
1782                 <Clock className="h-8 w-8 text-gray-400" />
1783               </div>
1784               <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Waiting for Bot</h2>
1785               <p className="text-gray-400 mb-8 text-base md:text-lg">
1786                 The server configuration has been created, but the Sycord bot hasn't joined this server yet. Once the
1787                 bot is added, you'll be able to configure all settings.
1788               </p>
1789               <div className="space-y-4">
1790                 <Link href="/dashboard">
1791                   <Button
1792                     variant="outline"
1793                     className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 w-full md:w-auto bg-transparent"
1794                   >
1795                     <ArrowLeft className="h-4 w-4 mr-2" />
1796                     Back to Dashboard
1797                   </Button>
1798                 </Link>
1799               </div>
1800             </CardContent>
1801           </Card>
1802         </div>
1803       </div>
1804     )
1805   }
1806 
1807   return (
1808     <div className="min-h-screen bg-black text-white">
1809       {/* Header */}
1810       <header className="glass-card border-b border-white/10 sticky top-0 z-50">
1811         <div className="container mx-auto px-4 py-3">
1812           <div className="flex items-center justify-between">
1813             <div className="flex items-center space-x-3">
1814               <Image src="/new-blue-logo.png" alt="Sycord Bot" width={28} height={28} className="rounded-lg" />
1815               <div>
1816                 <h1 className="text-lg font-bold text-white">
1817                   <span className="text-white">Sycord</span>
1818                 </h1>
1819               </div>
1820             </div>
1821 
1822             <DropdownMenu>
1823               <DropdownMenuTrigger asChild>
1824                 <Button
1825                   variant="outline"
1826                   className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
1827                 >
1828                   <div className="flex items-center space-x-2">
1829                     {serverConfig.server_icon ? (
1830                       <Image
1831                         src={`https://cdn.discordapp.com/icons/${serverId}/${serverConfig.server_icon}.png?size=32`}
1832                         alt={serverConfig.server_name || "Server Icon"}
1833                         width={20}
1834                         height={20}
1835                         className="rounded"
1836                       />
1837                     ) : (
1838                       <Avatar className="w-5 h-5">
1839                         <AvatarFallback className="text-xs bg-gray-600 text-white">
1840                           {serverConfig.server_name ? serverConfig.server_name.charAt(0) : "S"}
1841                         </AvatarFallback>
1842                       </Avatar>
1843                     )}
1844                     <span className="truncate max-w-32">{serverConfig.server_name}</span>
1845                     <ChevronDown className="h-4 w-4" />
1846                   </div>
1847                 </Button>
1848               </DropdownMenuTrigger>
1849               <DropdownMenuContent align="end" className="w-64">
1850                 {userServers.map((server) => (
1851                   <DropdownMenuItem key={server.serverId} asChild>
1852                     <Link href={`/dashboard/server/${server.serverId}`}>
1853                       <div className="flex items-center space-x-2 w-full">
1854                         <div className="w-5 h-5 bg-gray-600 rounded"></div>
1855                         <span className="truncate">{server.serverName}</span>
1856                       </div>
1857                     </Link>
1858                   </DropdownMenuItem>
1859                 ))}
1860                 <DropdownMenuSeparator />
1861                 <DropdownMenuItem asChild>
1862                   <Link href="/dashboard">
1863                     <div className="flex items-center space-x-2 w-full">
1864                       <Plus className="h-4 w-4" />
1865                       <span>Add Server</span>
1866                     </div>
1867                   </Link>
1868                 </DropdownMenuItem>
1869               </DropdownMenuContent>
1870             </DropdownMenu>
1871           </div>
1872         </div>
1873       </header>
1874 
1875       {/* Navigation Tabs */}
1876       <div className="glass-card border-b border-white/10">
1877         <div className="container mx-auto px-4 py-2">
1878           <nav className="flex space-x-1 overflow-x-auto">
1879             <Button
1880               variant={activeTab === "home" ? "default" : "ghost"}
1881               size="sm"
1882               onClick={() => setActiveTab("home")}
1883               className={`${
1884                 activeTab === "home" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
1885               } transition-colors flex-shrink-0 text-sm px-4 h-9`}
1886             >
1887               <Home className="h-4 w-4 mr-2" />
1888               Home
1889             </Button>
1890             <Button
1891               variant={activeTab === "sentinel" ? "default" : "ghost"}
1892               size="sm"
1893               onClick={() => setActiveTab("sentinel")}
1894               className={`${
1895                 activeTab === "sentinel" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
1896               } transition-colors flex-shrink-0 text-sm px-4 h-9`}
1897             >
1898               <Shield className="h-4 w-4 mr-2" />
1899               Sentinel
1900             </Button>
1901             <Button
1902               variant={activeTab === "support" ? "default" : "ghost"}
1903               size="sm"
1904               onClick={() => setActiveTab("support")}
1905               className={`${
1906                 activeTab === "support" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
1907               } transition-colors flex-shrink-0 text-sm px-4 h-9`}
1908             >
1909               <LifeBuoy className="h-4 w-4 mr-2" />
1910               Support
1911             </Button>
1912             <Button
1913               variant={activeTab === "events" ? "default" : "ghost"}
1914               size="sm"
1915               onClick={() => setActiveTab("events")}
1916               className={`${
1917                 activeTab === "events" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
1918               } transition-colors flex-shrink-0 text-sm px-4 h-9`}
1919             >
1920               <Gift className="h-4 w-4 mr-2" />
1921               Functions
1922             </Button>
1923             <Button
1924               variant={activeTab === "integrations" ? "default" : "ghost"}
1925               size="sm"
1926               onClick={() => setActiveTab("integrations")}
1927               className={`${
1928                 activeTab === "integrations"
1929                   ? "bg-white text-black"
1930                   : "text-white hover:bg-gray-100 hover:text-gray-900"
1931               } transition-colors flex-shrink-0 text-sm px-4 h-9`}
1932             >
1933               <LinkIcon className="h-4 w-4 mr-2" /> {/* Using LinkIcon for Integrations */}
1934               Integrations
1935             </Button>
1936             <Button
1937               variant={activeTab === "plugins" ? "default" : "ghost"}
1938               size="sm"
1939               onClick={() => setActiveTab("plugins")}
1940               className={`${
1941                 activeTab === "plugins" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
1942               } transition-colors flex-shrink-0 text-sm px-4 h-9`}
1943             >
1944               <Package className="h-4 w-4 mr-2" />
1945               Plugins
1946             </Button>
1947             <Button
1948               variant={activeTab === "settings" ? "default" : "ghost"}
1949               size="sm"
1950               onClick={() => setActiveTab("settings")}
1951               className={`${
1952                 activeTab === "settings" ? "bg-white text-black" : "text-white hover:bg-gray-100 hover:text-gray-900"
1953               } transition-colors flex-shrink-0 text-sm px-4 h-9`}
1954             >
1955               <Settings className="h-4 w-4 mr-2" />
1956               Settings
1957             </Button>
1958             {session?.user?.email === "dmarton336@gmail.com" && (
1959               <Button
1960                 variant={activeTab === "access-plus" ? "default" : "ghost"}
1961                 size="sm"
1962                 onClick={() => setActiveTab("access-plus")}
1963                 className={`${
1964                   activeTab === "access-plus"
1965                     ? "bg-white text-black"
1966                     : "text-white hover:bg-gray-100 hover:text-gray-900"
1967                 } transition-colors flex-shrink-0 text-sm px-4 h-9`}
1968               >
1969                 <Lock className="h-4 w-4 mr-2" />
1970                 Access+
1971               </Button>
1972             )}
1973           </nav>
1974         </div>
1975       </div>
1976 
1977       <div className="container mx-auto px-4 py-6">
1978         {/* Home Tab */}
1979         {activeTab === "home" && (
1980           <div className="space-y-6">
1981             {/* Simplified Server Info */}
1982             <Card className="glass-card">
1983               <CardContent className="p-4">
1984                 <div className="flex items-center justify-between">
1985                   {/* Server Icon and Name */}
1986                   <div className="flex items-center space-x-3">
1987                     {serverConfig.server_icon ? (
1988                       <Image
1989                         src={`https://cdn.discordapp.com/icons/${serverId}/${serverConfig.server_icon}.png?size=64`}
1990                         alt={serverConfig.server_name || "Server Icon"}
1991                         width={40}
1992                         height={40}
1993                         className="rounded-lg"
1994                       />
1995                     ) : (
1996                       <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
1997                         <Hash className="h-5 w-5 text-gray-400" />
1998                       </div>
1999                     )}
2000                     <div>
2001                       <h3 className="text-base font-semibold text-white">{serverConfig.server_name}</h3>
2002                     </div>
2003                   </div>
2004 
2005                   {/* Server Statistics */}
2006                   <div className="flex items-center space-x-4 text-xs">
2007                     <div className="text-center">
2008                       <div className="font-bold text-white">{serverConfig.server_stats?.total_members || 0}</div>
2009                       <div className="text-gray-400">Members</div>
2010                     </div>
2011                     <div className="text-center">
2012                       <div className="font-bold text-white">{serverConfig.server_stats?.total_bots || 0}</div>
2013                       <div className="text-gray-400">Bots</div>
2014                     </div>
2015                     <div className="text-center">
2016                       <div className="font-bold text-white">{serverConfig.server_stats?.total_admins || 0}</div>
2017                       <div className="text-gray-400">Admins</div>
2018                     </div>
2019                   </div>
2020                 </div>
2021               </CardContent>
2022             </Card>
2023 
2024             {/* Announcements */}
2025             {announcements.filter((ann) => !dismissedAnnouncements.includes(ann._id)).length > 0 && (
2026               <div className="space-y-4">
2027                 {announcements
2028                   .filter((ann) => !dismissedAnnouncements.includes(ann._id))
2029                   .map((ann) => (
2030                     <Alert key={ann._id} className="border-gray-500/30 bg-gray-500/10">
2031                       <Megaphone className="h-4 w-4" />
2032                       <AlertDescription className="text-gray-400 flex justify-between items-center">
2033                         <span>{ann.message}</span>
2034                         <Button
2035                           variant="ghost"
2036                           size="sm"
2037                           onClick={() => handleDismissAnnouncement(ann._id)}
2038                           className="text-gray-400 hover:bg-gray-100 hover:text-gray-900"
2039                         >
2040                           Dismiss
2041                         </Button>
2042                       </AlertDescription>
2043                     </Alert>
2044                   ))}
2045               </div>
2046             )}
2047 
2048             {/* Welcome Flow System */}
2049             <Card className="glass-card">
2050               <CardHeader>
2051                 <CardTitle className="text-white text-xl">Welcome System</CardTitle>
2052                 <CardDescription className="text-gray-400">Configure your server's welcome process</CardDescription>
2053               </CardHeader>
2054               <CardContent className="p-6">
2055                 <div className="space-y-6">
2056                   {/* Step 1: User Join Settings */}
2057                   <div className="relative">
2058                     <div
2059                       className={`p-3 rounded-lg border transition-all ${
2060                         serverConfig.welcome.enabled
2061                           ? "border-gray-500/50 bg-gray-500/5"
2062                           : "border-gray-500/50 bg-gray-500/5"
2063                       }`}
2064                     >
2065                       <div className="flex items-center justify-between">
2066                         <div className="flex items-center space-x-2">
2067                           <div
2068                             className={`w-7 h-7 rounded-lg flex items-center justify-center ${
2069                               serverConfig.welcome.enabled ? "bg-gray-500/20" : "bg-gray-500/20"
2070                             }`}
2071                           >
2072                             <LogIn
2073                               className={`h-4 w-4 ${serverConfig.welcome.enabled ? "text-gray-400" : "text-gray-400"}`}
2074                             />
2075                           </div>
2076                           <div>
2077                             <h3 className="font-medium text-white text-sm">User Join Settings</h3>
2078                             <p className="text-xs text-gray-400">Enable welcome system</p>
2079                           </div>
2080                         </div>
2081                         <Switch
2082                           checked={serverConfig.welcome.enabled}
2083                           onCheckedChange={(checked) =>
2084                             updateServerConfig({
2085                               welcome: { ...serverConfig.welcome, enabled: checked },
2086                             })
2087                           }
2088                         />
2089                       </div>
2090                     </div>
2091 
2092                     {/* Connection Line */}
2093                     {serverConfig.welcome.enabled && (
2094                       <div className="flex justify-center">
2095                         <div className="w-0.5 h-6 bg-gray-500"></div>
2096                       </div>
2097                     )}
2098                   </div>
2099 
2100                   {/* Member Verification */}
2101                   {serverConfig.welcome.enabled && (
2102                     <div className="relative">
2103                       <div className="flex justify-center">
2104                         <button
2105                           onClick={() =>
2106                             updateServerConfig({
2107                               moderation: {
2108                                 ...serverConfig.moderation,
2109                                 suspicious_accounts: {
2110                                   ...serverConfig.moderation.suspicious_accounts,
2111                                   enabled: !serverConfig.moderation.suspicious_accounts.enabled,
2112                                 },
2113                               },
2114                             })
2115                           }
2116                           className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
2117                             serverConfig.moderation.suspicious_accounts.enabled
2118                               ? "bg-gray-500/20 border border-gray-500/50"
2119                               : "bg-gray-500/20 border border-gray-500/50"
2120                           }`}
2121                         >
2122                           <Shield
2123                             className={`h-4 w-4 ${
2124                               serverConfig.moderation.suspicious_accounts.enabled ? "text-gray-400" : "text-gray-400"
2125                             }`}
2126                           />
2127                         </button>
2128                       </div>
2129 
2130                       {/* 3-Way Route */}
2131                       {serverConfig.moderation.suspicious_accounts.enabled && (
2132                         <>
2133                           <div className="flex justify-center mt-2">
2134                             <div className="w-0.5 h-4 bg-gray-500"></div>
2135                           </div>
2136                           <div className="flex justify-center">
2137                             <div className="w-48 h-0.5 bg-gray-500"></div>
2138                           </div>
2139                           <div
2140                             className="flex justify-between items-start relative"
2141                             style={{ marginLeft: "calc(50% - 96px)", marginRight: "calc(50% - 96px)" }}
2142                           >
2143                             <div className="w-0.5 h-4 bg-gray-500"></div>
2144                             <div className="w-0.5 h-4 bg-gray-500"></div>
2145                             <div className="w-0.5 h-4 bg-gray-500"></div>
2146                           </div>
2147                         </>
2148                       )}
2149 
2150                       {/* 3-Way Options */}
2151                       {serverConfig.moderation.suspicious_accounts.enabled && (
2152                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
2153                           {/* Suspicious Account Scanner */}
2154                           <div className="p-3 rounded-lg border border-gray-700/30 bg-gray-700/5">
2155                             <div className="flex items-center space-x-2 mb-2">
2156                               <UserCheck className="h-4 w-4 text-gray-400" />
2157                               <h4 className="font-medium text-white text-sm">Suspicious Scanner</h4>
2158                             </div>
2159                             <div>
2160                               <Label className="text-white text-xs mb-1 block">Min age (days)</Label>
2161                               <Input
2162                                 type="number"
2163                                 min="1"
2164                                 max="365"
2165                                 value={serverConfig.moderation.suspicious_accounts.min_age_days || 30}
2166                                 onChange={(e) =>
2167                                   updateServerConfig({
2168                                     moderation: {
2169                                       ...serverConfig.moderation,
2170                                       suspicious_accounts: {
2171                                         ...serverConfig.moderation.suspicious_accounts,
2172                                         min_age_days: Number.parseInt(e.target.value) || 30,
2173                                       },
2174                                     },
2175                                   })
2176                                 }
2177                                 className="bg-black/60 border-white/20 text-white h-7 text-xs"
2178                               />
2179                             </div>
2180                           </div>
2181 
2182                           {/* Bot Scanner */}
2183                           <div className="p-3 rounded-lg border border-gray-500/30 bg-gray-500/5">
2184                             <div className="flex items-center justify-between mb-2">
2185                               <div className="flex items-center space-x-2">
2186                                 <Bot className="h-4 w-4 text-gray-400" />
2187                                 <h4 className="font-medium text-white text-sm">Bot Scanner</h4>
2188                               </div>
2189                               <Switch
2190                                 checked={serverConfig.moderation.malicious_bot_detection.enabled}
2191                                 onCheckedChange={(checked) =>
2192                                   updateServerConfig({
2193                                     moderation: {
2194                                       ...serverConfig.moderation,
2195                                       malicious_bot_detection: {
2196                                         ...serverConfig.moderation.malicious_bot_detection,
2197                                         enabled: checked,
2198                                       },
2199                                     },
2200                                   })
2201                                 }
2202                               />
2203                             </div>
2204                           </div>
2205 
2206                           {/* Alt Detector */}
2207                           <div className="p-3 rounded-lg border border-gray-600/30 bg-gray-600/5">
2208                             <div className="flex items-center justify-between mb-2">
2209                               <div className="flex items-center space-x-2">
2210                                 <Eye className="h-4 w-4 text-gray-400" />
2211                                 <h4 className="font-medium text-white text-sm">Alt Detector</h4>
2212                               </div>
2213                               <Switch
2214                                 checked={serverConfig.moderation.raid_protection.enabled}
2215                                 onCheckedChange={(checked) =>
2216                                   updateServerConfig({
2217                                     moderation: {
2218                                       ...serverConfig.moderation,
2219                                       raid_protection: {
2220                                         ...serverConfig.moderation.raid_protection,
2221                                         enabled: checked,
2222                                       },
2223                                     },
2224                                   })
2225                                 }
2226                               />
2227                             </div>
2228                             {serverConfig.moderation.raid_protection.enabled && (
2229                               <div>
2230                                 <Label className="text-white text-xs mb-1 block">Threshold</Label>
2231                                 <Input
2232                                   type="number"
2233                                   min="1"
2234                                   max="50"
2235                                   value={serverConfig.moderation.raid_protection.threshold || 10}
2236                                   onChange={(e) =>
2237                                     updateServerConfig({
2238                                       moderation: {
2239                                         ...serverConfig.moderation,
2240                                         raid_protection: {
2241                                           ...serverConfig.moderation.raid_protection,
2242                                           threshold: Number.parseInt(e.target.value) || 10,
2243                                         },
2244                                       },
2245                                     })
2246                                   }
2247                                   className="bg-black/60 border-white/20 text-white h-7 text-xs"
2248                                 />
2249                               </div>
2250                             )}
2251                           </div>
2252                         </div>
2253                       )}
2254 
2255                       {/* Connection Line to Welcome Message */}
2256                       <div className="flex justify-center mt-4">
2257                         <div className="w-0.5 h-6 bg-gray-500"></div>
2258                       </div>
2259                     </div>
2260                   )}
2261 
2262                   {/* Welcome Message */}
2263                   {serverConfig.welcome.enabled && (
2264                     <div className="relative">
2265                       <div
2266                         className={`p-3 rounded-lg border transition-all ${
2267                           serverConfig.welcome.message
2268                             ? "border-gray-500/50 bg-gray-500/5"
2269                             : "border-gray-500/50 bg-gray-500/5"
2270                         }`}
2271                       >
2272                         <div className="flex items-center justify-between mb-3">
2273                           <div className="flex items-center space-x-2">
2274                             <div
2275                               className={`w-7 h-7 rounded-lg flex items-center justify-center ${
2276                                 serverConfig.welcome.message ? "bg-gray-500/20" : "bg-gray-500/20"
2277                               }`}
2278                             >
2279                               <MessageSquare
2280                                 className={`h-4 w-4 ${
2281                                   serverConfig.welcome.message ? "text-gray-400" : "text-gray-400"
2282                                 }`}
2283                               />
2284                             </div>
2285                             <div>
2286                               <h3 className="font-medium text-white text-sm">Welcome Message</h3>
2287                               <p className="text-xs text-gray-400">Send message to new members</p>
2288                             </div>
2289                           </div>
2290                           <Switch
2291                             checked={!!serverConfig.welcome.message}
2292                             onCheckedChange={(checked) =>
2293                               updateServerConfig({
2294                                 welcome: {
2295                                   ...serverConfig.welcome,
2296                                   message: checked ? "Welcome {user} to {server}!" : "",
2297                                 },
2298                               })
2299                             }
2300                           />
2301                         </div>
2302 
2303                         {serverConfig.welcome.message && (
2304                           <div className="space-y-3">
2305                             <div className="flex space-x-2">
2306                               <Button
2307                                 variant="outline"
2308                                 size="sm"
2309                                 className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 h-7 text-xs bg-transparent"
2310                               >
2311                                 Simple Text
2312                               </Button>
2313                               <Button
2314                                 variant="outline"
2315                                 size="sm"
2316                                 className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 h-7 text-xs bg-transparent"
2317                               >
2318                                 Embedded
2319                               </Button>
2320                             </div>
2321                             <Textarea
2322                               placeholder="Welcome {user} to {server}!"
2323                               value={serverConfig.welcome.message || ""}
2324                               onChange={(e) =>
2325                                 updateServerConfig({
2326                                   welcome: { ...serverConfig.welcome, message: e.target.value },
2327                                 })
2328                               }
2329                               className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[80px] text-sm"
2330                             />
2331                             <p className="text-xs text-gray-400">
2332                               Use {"{user}"} for username and {"{server}"} for server name
2333                             </p>
2334                           </div>
2335                         )}
2336                       </div>
2337 
2338                       {/* Connection Line to Role Assignment */}
2339                       <div className="flex justify-center mt-4">
2340                         <div className="w-0.5 h-6 bg-gray-500"></div>
2341                       </div>
2342                     </div>
2343                   )}
2344 
2345                   {/* Role Assignment */}
2346                   {serverConfig.welcome.enabled && (
2347                     <div className="relative">
2348                       <div
2349                         className={`p-3 rounded-lg border transition-all ${
2350                           serverConfig.moderation.auto_role.enabled
2351                             ? "border-gray-500/50 bg-gray-500/5"
2352                             : "border-gray-500/50 bg-gray-500/5"
2353                         }`}
2354                       >
2355                         <div className="flex items-center justify-between mb-3">
2356                           <div className="flex items-center space-x-2">
2357                             <div
2358                               className={`w-7 h-7 rounded-lg flex items-center justify-center ${
2359                                 serverConfig.moderation.auto_role.enabled ? "bg-gray-500/20" : "bg-gray-500/20"
2360                               }`}
2361                             >
2362                               <Crown
2363                                 className={`h-4 w-4 ${
2364                                   serverConfig.moderation.auto_role.enabled ? "text-gray-400" : "text-gray-400"
2365                                 }`}
2366                               />
2367                             </div>
2368                             <div>
2369                               <h3 className="font-medium text-white text-sm">Role Assignment</h3>
2370                               <p className="text-xs text-gray-400">Auto-assign roles to new members</p>
2371                             </div>
2372                           </div>
2373                           <Switch
2374                             checked={serverConfig.moderation.auto_role.enabled}
2375                             onCheckedChange={(checked) =>
2376                               updateServerConfig({
2377                                 moderation: {
2378                                   ...serverConfig.moderation,
2379                                   auto_role: { ...serverConfig.moderation.auto_role, enabled: checked },
2380                                 },
2381                               })
2382                             }
2383                           />
2384                         </div>
2385 
2386                         {serverConfig.moderation.auto_role.enabled && (
2387                           <div>
2388                             <Label className="text-white text-sm mb-2 block">Default Role</Label>
2389                             <Select
2390                               value={serverConfig.moderation.auto_role.role_id || ""}
2391                               onValueChange={(value) =>
2392                                 updateServerConfig({
2393                                   moderation: {
2394                                     ...serverConfig.moderation,
2395                                     auto_role: { ...serverConfig.moderation.auto_role, role_id: value },
2396                                   },
2397                                 })
2398                               }
2399                             >
2400                               <SelectTrigger className="bg-black/60 border-white/20 h-8">
2401                                 <SelectValue placeholder="Select a role">
2402                                   {serverConfig.moderation.auto_role.role_id && (
2403                                     <div className="flex items-center">
2404                                       <div className="w-2 h-2 rounded-full mr-2 bg-gray-500" />
2405                                       {getRoleName(serverConfig.moderation.auto_role.role_id)}
2406                                     </div>
2407                                   )}
2408                                 </SelectValue>
2409                               </SelectTrigger>
2410                               <SelectContent>
2411                                 {Object.entries(serverConfig.roles_and_names).map(([id, name]) => (
2412                                   <SelectItem key={id} value={id}>
2413                                     <div className="flex items-center">
2414                                       <div className="w-2 h-2 rounded-full mr-2 bg-gray-500" />
2415                                       {name}
2416                                     </div>
2417                                   </SelectItem>
2418                                 ))}
2419                               </SelectContent>
2420                             </Select>
2421                           </div>
2422                         )}
2423                       </div>
2424                     </div>
2425                   )}
2426                 </div>
2427               </CardContent>
2428             </Card>
2429           </div>
2430         )}
2431 
2432         {/* Sentinel Tab */}
2433         {activeTab === "sentinel" && (
2434           <div className="space-y-6">
2435             {/* Moderation Level Selector - Smaller buttons */}
2436             <Card className="glass-card">
2437               <CardHeader>
2438                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
2439                   <div>
2440                     <CardTitle className="text-white flex items-center text-xl">
2441                       <Shield className="h-6 w-6 mr-3" />
2442                       Moderation Level
2443                     </CardTitle>
2444                     <CardDescription className="text-gray-400">Choose your server's security level</CardDescription>
2445                   </div>
2446                   <Button
2447                     variant="outline"
2448                     size="sm"
2449                     onClick={() => setShowInfoModal(true)}
2450                     className="border-gray-500/50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 w-full sm:w-auto"
2451                   >
2452                     <Info className="h-4 w-4 mr-2" />
2453                     How we trained our bot
2454                   </Button>
2455                 </div>
2456               </CardHeader>
2457               <CardContent>
2458                 {/* Smaller buttons side by side */}
2459                 <div className="flex flex-wrap gap-2">
2460                   <Button
2461                     variant={serverConfig.moderation_level === "off" ? "default" : "outline"}
2462                     size="sm"
2463                     onClick={() => handleModerationLevelChange("off")}
2464                     className={`${
2465                       serverConfig.moderation_level === "off"
2466                         ? "bg-white text-black"
2467                         : "border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
2468                     }`}
2469                   >
2470                     <Shield className="h-3 w-3 mr-1" />
2471                     Off
2472                   </Button>
2473 
2474                   <Button
2475                     variant={serverConfig.moderation_level === "on" ? "default" : "outline"}
2476                     size="sm"
2477                     onClick={() => handleModerationLevelChange("on")}
2478                     className={`${
2479                       serverConfig.moderation_level === "on"
2480                         ? "bg-white text-black"
2481                         : "border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
2482                     }`}
2483                   >
2484                     <Shield className="h-3 w-3 mr-1" />
2485                     On
2486                   </Button>
2487 
2488                   <Button
2489                     variant={serverConfig.moderation_level === "lockdown" ? "default" : "outline"}
2490                     size="sm"
2491                     onClick={() => handleModerationLevelChange("lockdown")}
2492                     className={`${
2493                       serverConfig.moderation_level === "lockdown"
2494                         ? "bg-white text-black"
2495                         : "border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
2496                     }`}
2497                   >
2498                     <AlertTriangle className="h-3 w-3 mr-1" />
2499                     Lockdown
2500                   </Button>
2501                 </div>
2502 
2503                 {serverConfig.moderation_level === "lockdown" && (
2504                   <Alert className="mt-4 border-gray-500/30 bg-gray-500/10">
2505                     <AlertTriangle className="h-4 w-4" />
2506                     <AlertDescription className="text-gray-400">
2507                       Lockdown mode enables all security features. Your server will have maximum protection but some
2508                       legitimate activities may be restricted.
2509                     </AlertDescription>
2510                   </Alert>
2511                 )}
2512               </CardContent>
2513             </Card>
2514 
2515             {/* Basic Filters - Side by side on desktop, stacked on mobile */}
2516             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
2517               {/* Bad Word Filter */}
2518               <Card className="glass-card">
2519                 <CardHeader className="pb-3">
2520                   <CardTitle className="text-white flex items-center text-base">
2521                     <Filter className="h-4 w-4 mr-2" />
2522                     Bad Word Filter
2523                   </CardTitle>
2524                 </CardHeader>
2525                 <CardContent className="space-y-3">
2526                   <div className="flex items-center justify-between">
2527                     <span className="text-white text-sm">Enable Filter</span>
2528                     <Switch
2529                       checked={serverConfig.moderation.bad_word_filter.enabled}
2530                       onCheckedChange={(checked) =>
2531                         updateServerConfig({
2532                           moderation: {
2533                             ...serverConfig.moderation,
2534                             bad_word_filter: { ...serverConfig.moderation.bad_word_filter, enabled: checked },
2535                           },
2536                         })
2537                       }
2538                     />
2539                   </div>
2540                   {serverConfig.moderation.bad_word_filter.enabled && (
2541                     <div>
2542                       <Label className="text-white text-xs mb-1 block">Custom Words</Label>
2543                       <Textarea
2544                         placeholder="word1, word2, word3"
2545                         value={serverConfig.moderation.bad_word_filter.custom_words?.join(", ") || ""}
2546                         onChange={(e) =>
2547                           updateServerConfig({
2548                             moderation: {
2549                               ...serverConfig.moderation,
2550                               bad_word_filter: {
2551                                 ...serverConfig.moderation.bad_word_filter,
2552                                 custom_words: e.target.value
2553                                   .split(",")
2554                                   .map((w) => w.trim())
2555                                   .filter((w) => w),
2556                               },
2557                             },
2558                           })
2559                         }
2560                         className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[60px] text-xs"
2561                       />
2562                     </div>
2563                   )}
2564                 </CardContent>
2565               </Card>
2566 
2567               {/* Link Filter */}
2568               <Card className="glass-card">
2569                 <CardHeader className="pb-3">
2570                   <CardTitle className="text-white flex items-center text-base">
2571                     <LinkIcon className="h-4 w-4 mr-2" />
2572                     Link Filter
2573                   </CardTitle>
2574                 </CardHeader>
2575                 <CardContent className="space-y-3">
2576                   <div className="flex items-center justify-between">
2577                     <span className="text-white text-sm">Enable Scanner</span>
2578                     <Switch
2579                       checked={serverConfig.moderation.link_filter.enabled}
2580                       onCheckedChange={(checked) =>
2581                         updateServerConfig({
2582                           moderation: {
2583                             ...serverConfig.moderation,
2584                             link_filter: { ...serverConfig.moderation.link_filter, enabled: checked },
2585                           },
2586                         })
2587                       }
2588                     />
2589                   </div>
2590                   {serverConfig.moderation.link_filter.enabled && (
2591                     <div>
2592                       <Label className="text-white text-xs mb-1 block">Scanning Mode</Label>
2593                       <Select
2594                         value={serverConfig.moderation.link_filter.config}
2595                         onValueChange={(value: "all_links" | "whitelist_only" | "phishing_only") =>
2596                           updateServerConfig({
2597                             moderation: {
2598                               ...serverConfig.moderation,
2599                               link_filter: { ...serverConfig.moderation.link_filter, config: value },
2600                             },
2601                           })
2602                         }
2603                       >
2604                         <SelectTrigger className="bg-black/60 border-white/20 h-8">
2605                           <SelectValue />
2606                         </SelectTrigger>
2607                         <SelectContent>
2608                           <SelectItem value="phishing_only">Block fraud only</SelectItem>
2609                           <SelectItem value="all_links">Block all links</SelectItem>
2610                           <SelectItem value="whitelist_only">Whitelist only</SelectItem>
2611                         </SelectContent>
2612                       </Select>
2613                     </div>
2614                   )}
2615                 </CardContent>
2616               </Card>
2617 
2618               {/* Document Filter */}
2619               <Card className="glass-card">
2620                 <CardHeader className="pb-3">
2621                   <CardTitle className="text-white flex items-center text-base">
2622                     <FileText className="h-4 w-4 mr-2" />
2623                     Document Filter
2624                   </CardTitle>
2625                 </CardHeader>
2626                 <CardContent className="space-y-3">
2627                   <div className="flex items-center justify-between">
2628                     <span className="text-white text-sm">Enable Scanner</span>
2629                     <Switch
2630                       checked={serverConfig.moderation.malicious_file_scanner.enabled}
2631                       onCheckedChange={(checked) =>
2632                         updateServerConfig({
2633                           moderation: {
2634                             ...serverConfig.moderation,
2635                             malicious_file_scanner: {
2636                               ...serverConfig.moderation.malicious_file_scanner,
2637                               enabled: checked,
2638                             },
2639                           },
2640                         })
2641                       }
2642                     />
2643                   </div>
2644                   {serverConfig.moderation.malicious_file_scanner.enabled && (
2645                     <div>
2646                       <Label className="text-white text-xs mb-1 block">Allowed Types</Label>
2647                       <Input
2648                         placeholder="jpg, png, pdf"
2649                         value={serverConfig.moderation.malicious_file_scanner.allowed_file_types?.join(", ") || ""}
2650                         onChange={(e) =>
2651                           updateServerConfig({
2652                             moderation: {
2653                               ...serverConfig.moderation,
2654                               malicious_file_scanner: {
2655                                 ...serverConfig.moderation.malicious_file_scanner,
2656                                 allowed_file_types: e.target.value
2657                                   .split(",")
2658                                   .map((t) => t.trim())
2659                                   .filter((t) => t),
2660                               },
2661                             },
2662                           })
2663                         }
2664                         className="bg-black/60 border-white/20 text-white placeholder-gray-400 h-8 text-xs"
2665                       />
2666                     </div>
2667                   )}
2668                 </CardContent>
2669               </Card>
2670             </div>
2671 
2672             {/* Separator Line */}
2673             <div className="border-t border-white/20"></div>
2674 
2675             {/* Community Management */}
2676             <div>
2677               <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
2678                 <Users className="h-5 w-5 mr-2" />
2679                 Community Management
2680               </h3>
2681               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
2682                 {/* Mass Ping Protection */}
2683                 <Card className="glass-card">
2684                   <CardHeader className="pb-3">
2685                     <CardTitle className="text-white flex items-center text-base">
2686                       <MessageCircle className="h-4 w-4 mr-2" />
2687                       Mass Ping Protection
2688                     </CardTitle>
2689                   </CardHeader>
2690                   <CardContent className="space-y-3">
2691                     <div className="flex items-center justify-between">
2692                       <span className="text-white text-sm">Enable Protection</span>
2693                       <Switch
2694                         checked={serverConfig.moderation.mass_ping_protection.enabled}
2695                         onCheckedChange={(checked) =>
2696                           updateServerConfig({
2697                             moderation: {
2698                               ...serverConfig.moderation,
2699                               mass_ping_protection: {
2700                                 ...serverConfig.moderation.mass_ping_protection,
2701                                 enabled: checked,
2702                               },
2703                             },
2704                           })
2705                         }
2706                       />
2707                     </div>
2708                     {serverConfig.moderation.mass_ping_protection.enabled && (
2709                       <div className="space-y-2">
2710                         <div>
2711                           <Label className="text-white text-xs mb-1 block">Rate Limit (per minute)</Label>
2712                           <Input
2713                             type="number"
2714                             min="1"
2715                             max="50"
2716                             value={serverConfig.moderation.mass_ping_protection.mention_rate_limit}
2717                             onChange={(e) =>
2718                               updateServerConfig({
2719                                 moderation: {
2720                                   ...serverConfig.moderation,
2721                                   mass_ping_protection: {
2722                                     ...serverConfig.moderation.mass_ping_protection,
2723                                     mention_rate_limit: Number.parseInt(e.target.value) || 5,
2724                                   },
2725                                 },
2726                               })
2727                             }
2728                             className="bg-black/60 border-white/20 text-white h-8"
2729                           />
2730                         </div>
2731                       </div>
2732                     )}
2733                   </CardContent>
2734                 </Card>
2735 
2736                 {/* Invite Link Protection */}
2737                 <Card className="glass-card">
2738                   <CardHeader className="pb-3">
2739                     <CardTitle className="text-white flex items-center text-base">
2740                       <LinkIcon className="h-4 w-4 mr-2" />
2741                       Invite Protection
2742                     </CardTitle>
2743                   </CardHeader>
2744                   <CardContent className="space-y-3">
2745                     <div className="flex items-center justify-between">
2746                       <span className="text-white text-sm">Enable Protection</span>
2747                       <Switch
2748                         checked={serverConfig.moderation.invite_hijacking.enabled}
2749                         onCheckedChange={(checked) =>
2750                           updateServerConfig({
2751                             moderation: {
2752                               ...serverConfig.moderation,
2753                               invite_hijacking: { ...serverConfig.moderation.invite_hijacking, enabled: checked },
2754                             },
2755                           })
2756                         }
2757                       />
2758                     </div>
2759                   </CardContent>
2760                 </Card>
2761               </div>
2762             </div>
2763 
2764             {/* Admin & Bots */}
2765             <div>
2766               <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
2767                 <Crown className="h-5 w-5 mr-2" />
2768                 Admin & Bots
2769               </h3>
2770               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
2771                 {/* Permission Abuse */}
2772                 <Card className="glass-card">
2773                   <CardHeader className="pb-3">
2774                     <CardTitle className="text-white flex items-center text-base">
2775                       <Eye className="h-4 w-4 mr-2" />
2776                       Permission Monitoring
2777                     </CardTitle>
2778                   </CardHeader>
2779                   <CardContent className="space-y-3">
2780                     <div className="flex items-center justify-between">
2781                       <span className="text-white text-sm">Enable Monitoring</span>
2782                       <Switch
2783                         checked={serverConfig.moderation.permission_abuse.enabled}
2784                         onCheckedChange={(checked) =>
2785                           updateServerConfig({
2786                             moderation: {
2787                               ...serverConfig.moderation,
2788                               permission_abuse: { ...serverConfig.moderation.permission_abuse, enabled: checked },
2789                             },
2790                           })
2791                         }
2792                       />
2793                     </div>
2794                   </CardContent>
2795                 </Card>
2796 
2797                 {/* Token/Webhook Abuse */}
2798                 <Card className="glass-card">
2799                   <CardHeader className="pb-3">
2800                     <CardTitle className="text-white flex items-center text-base">
2801                       <Webhook className="h-4 w-4 mr-2" />
2802                       Webhook Protection
2803                     </CardTitle>
2804                   </CardHeader>
2805                   <CardContent className="space-y-3">
2806                     <div className="flex items-center justify-between">
2807                       <span className="text-white text-sm">Enable Protection</span>
2808                       <Switch
2809                         checked={serverConfig.moderation.token_webhook_abuse.enabled}
2810                         onCheckedChange={(checked) =>
2811                           updateServerConfig({
2812                             moderation: {
2813                               ...serverConfig.moderation,
2814                               token_webhook_abuse: { ...serverConfig.moderation.token_webhook_abuse, enabled: checked },
2815                             },
2816                           })
2817                         }
2818                       />
2819                     </div>
2820                   </CardContent>
2821                 </Card>
2822               </div>
2823             </div>
2824 
2825             {/* Fraud Protection */}
2826             <div>
2827               <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
2828                 <AlertTriangle className="h-5 w-5 mr-2" />
2829                 Fraud Protection
2830               </h3>
2831               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
2832                 {/* Malicious Bot Detection */}
2833                 <Card className="glass-card">
2834                   <CardHeader className="pb-3">
2835                     <CardTitle className="text-white flex items-center text-base">
2836                       <Bot className="h-4 w-4 mr-2" />
2837                       Bot Detection
2838                     </CardTitle>
2839                   </CardHeader>
2840                   <CardContent className="space-y-3">
2841                     <div className="flex items-center justify-between">
2842                       <span className="text-white text-sm">Enable Detection</span>
2843                       <Switch
2844                         checked={serverConfig.moderation.malicious_bot_detection.enabled}
2845                         onCheckedChange={(checked) =>
2846                           updateServerConfig({
2847                             moderation: {
2848                               ...serverConfig.moderation,
2849                               malicious_bot_detection: {
2850                                 ...serverConfig.moderation.malicious_bot_detection,
2851                                 enabled: checked,
2852                               },
2853                             },
2854                           })
2855                         }
2856                       />
2857                     </div>
2858                   </CardContent>
2859                 </Card>
2860 
2861                 {/* Raid Protection */}
2862                 <Card className="glass-card">
2863                   <CardHeader className="pb-3">
2864                     <CardTitle className="text-white flex items-center text-base">
2865                       <Shield className="h-4 w-4 mr-2" />
2866                       Raid Protection
2867                     </CardTitle>
2868                   </CardHeader>
2869                   <CardContent className="space-y-3">
2870                     <div className="flex items-center justify-between">
2871                       <span className="text-white text-sm">Enable Protection</span>
2872                       <Switch
2873                         checked={serverConfig.moderation.raid_protection.enabled}
2874                         onCheckedChange={(checked) =>
2875                           updateServerConfig({
2876                             moderation: {
2877                               ...serverConfig.moderation,
2878                               raid_protection: {
2879                                 ...serverConfig.moderation.raid_protection,
2880                                 enabled: checked,
2881                               },
2882                             },
2883                           })
2884                         }
2885                       />
2886                     </div>
2887                   </CardContent>
2888                 </Card>
2889               </div>
2890             </div>
2891 
2892             {/* Info Modal */}
2893             {showInfoModal && (
2894               <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
2895                 <Card className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
2896                   <CardHeader>
2897                     <div className="flex items-center justify-between">
2898                       <CardTitle className="text-white flex items-center text-xl">
2899                         <Zap className="h-6 w-6 mr-3" />
2900                         How We Trained Our Bot
2901                       </CardTitle>
2902                       <Button
2903                         variant="ghost"
2904                         size="icon"
2905                         onClick={() => setShowInfoModal(false)}
2906                         className="text-white hover:bg-gray-100 hover:text-gray-900"
2907                       >
2908                         ×
2909                       </Button>
2910                     </div>
2911                   </CardHeader>
2912                   <CardContent>
2913                     <div className="text-gray-300 space-y-4 leading-relaxed">
2914                       <p>
2915                         We started by researching hundreds of real Discord server compromises, studying how attackers
2916                         exploited roles, bots, and permissions. Logs, case studies, and community reports helped us
2917                         identify patterns like sudden role escalations, webhook abuse, and bot-based infiltration.
2918                       </p>
2919                       <p>
2920                         We analyzed the timing, methods, and impact of phishing links, mass joins, and admin bypasses.
2921                         By comparing dozens of attacks, we built a deep understanding of both technical and human
2922                         vulnerabilities.
2923                       </p>
2924                       <p>
2925                         We analyzed the timing, methods, and impact of phishing links, mass joins, and admin bypasses.
2926                         By comparing dozens of attacks, we built a deep understanding of both technical and human
2927                         vulnerabilities.
2928                       </p>
2929                       <p>
2930                         This research became the foundation for every security function we built into Sycord. Our bot
2931                         doesn't just follow generic rules - it understands real attack patterns and adapts to protect
2932                         your server accordingly.
2933                       </p>
2934                     </div>
2935                   </CardContent>
2936                 </Card>
2937               </div>
2938             )}
2939 
2940             {/* Lockdown Warning Dialog */}
2941             <Dialog open={showLockdownWarning} onOpenChange={setShowLockdownWarning}>
2942               <DialogContent className="glass-card max-w-md">
2943                 <DialogHeader>
2944                   <DialogTitle className="text-white flex items-center">
2945                     <Lock className="h-5 w-5 mr-2" />
2946                     Lockdown Confirmation
2947                   </DialogTitle>
2948                   <DialogDescription className="text-gray-400">
2949                     Are you sure you want to activate Lockdown Mode?
2950                   </DialogDescription>
2951                 </DialogHeader>
2952                 <div className="space-y-4">
2953                   <p className="text-gray-300">
2954                     Activating lockdown mode will lock all channels in your server, preventing members from sending
2955                     messages. This is intended for severe raid situations.
2956                   </p>
2957                   <div className="flex justify-center">
2958                     <Image
2959                       src="/placeholder.svg?height=150&width=250"
2960                       alt="Lockdown Active"
2961                       width={250}
2962                       height={150}
2963                       className="rounded-lg"
2964                     />
2965                   </div>
2966                 </div>
2967                 <DialogFooter>
2968                   <Button
2969                     variant="outline"
2970                     onClick={() => setShowLockdownWarning(false)}
2971                     className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
2972                   >
2973                     Cancel
2974                   </Button>
2975                   <Button onClick={confirmLockdown} className="bg-white text-black hover:bg-gray-100">
2976                     Lock Channels
2977                   </Button>
2978                 </DialogFooter>
2979               </DialogContent>
2980             </Dialog>
2981           </div>
2982         )}
2983 
2984         {/* Support Tab */}
2985         {activeTab === "support" && (
2986           <div className="space-y-6">
2987             {/* Support Functions Overview */}
2988             {!activeSupportSection && (
2989               <div className="grid grid-cols-1 gap-6">
2990                 {/* Staff Insights Card */}
2991                 <Card
2992                   className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
2993                   onClick={() => setActiveSupportSection("staff")}
2994                 >
2995                   <CardContent className="p-6">
2996                     <div className="flex items-center space-x-4 mb-4">
2997                       <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
2998                         <Users className="h-6 w-6 text-white" />
2999                       </div>
3000                       <div>
3001                         <h3 className="text-lg font-semibold text-white">Staff Insights</h3>
3002                         <p className="text-sm text-gray-400">Monitor staff performance and reputation</p>
3003                       </div>
3004                     </div>
3005                     <div className="space-y-2">
3006                       <div className="flex justify-between text-sm">
3007                         <span className="text-gray-400">Status:</span>
3008                         <span
3009                           className={`${serverConfig.support?.reputation_enabled ? "text-green-400" : "text-gray-400"}`}
3010                         >
3011                           {serverConfig.support?.reputation_enabled ? "Enabled" : "Disabled"}
3012                         </span>
3013                       </div>
3014                       <div className="flex justify-between text-sm">
3015                         <span className="text-gray-400">Active Staff:</span>
3016                         <span className="text-white">{serverConfig.support?.staff?.length || 0}</span>
3017                       </div>
3018                     </div>
3019                   </CardContent>
3020                 </Card>
3021 
3022                 {/* Ticket System Card */}
3023                 <Card
3024                   className="glass-card cursor-pointer hover:bg-white/5 transition-colors"
3025                   onClick={() => setActiveSupportSection("tickets")}
3026                 >
3027                   <CardContent className="p-6">
3028                     <div className="flex items-center space-x-4 mb-4">
3029                       <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
3030                         <MessageSquare className="h-6 w-6 text-white" />
3031                       </div>
3032                       <div>
3033                         <h3 className="text-lg font-semibold text-white">Ticket System</h3>
3034                         <p className="text-sm text-gray-400">Configure support tickets and embeds</p>
3035                       </div>
3036                     </div>
3037                     <div className="space-y-2">
3038                       <div className="flex justify-between text-sm">
3039                         <span className="text-gray-400">Status:</span>
3040                         <span
3041                           className={`${serverConfig.support?.ticket_system?.enabled ? "text-green-400" : "text-gray-400"}`}
3042                         >
3043                           {serverConfig.support?.ticket_system?.enabled ? "Active" : "Inactive"}
3044                         </span>
3045                       </div>
3046                       <div className="flex justify-between text-sm">
3047                         <span className="text-gray-400">Channel:</span>
3048                         <span className="text-white">
3049                           {serverConfig.support?.ticket_system?.channel_id
3050                             ? getChannelName(serverConfig.support.ticket_system.channel_id)
3051                             : "Not set"}
3052                         </span>
3053                       </div>
3054                     </div>
3055                   </CardContent>
3056                 </Card>
3057               </div>
3058             )}
3059 
3060             {/* Staff Insights Section */}
3061             {activeSupportSection === "staff" && (
3062               <div className="space-y-6">
3063                 {/* Back Button */}
3064                 <Button
3065                   variant="ghost"
3066                   onClick={() => setActiveSupportSection(null)}
3067                   className="text-white hover:bg-gray-100 hover:text-gray-900"
3068                 >
3069                   <ArrowLeft className="h-4 w-4 mr-2 text-white" />
3070                   Back to Support
3071                 </Button>
3072 
3073                 {/* Staff Insights Content - Keep existing staff insights card content */}
3074                 <Card className="glass-card">
3075                   <CardHeader>
3076                     <div className="flex items-center justify-between">
3077                       <div>
3078                         <CardTitle className="text-white flex items-center text-xl">
3079                           <Users className="h-6 w-6 mr-3" />
3080                           Staff Insights
3081                         </CardTitle>
3082                         <CardDescription className="text-gray-400">
3083                           Monitor your support staff performance and reputation
3084                         </CardDescription>
3085                       </div>
3086                       <Dialog open={showReputationInfo} onOpenChange={setShowReputationInfo}>
3087                         <DialogTrigger asChild>
3088                           <Button
3089                             variant="ghost"
3090                             size="icon"
3091                             className="text-gray-400 hover:bg-gray-100 hover:text-gray-900"
3092                           >
3093                             <Info className="h-4 w-4" />
3094                           </Button>
3095                         </DialogTrigger>
3096                         <DialogContent className="glass-card max-w-md">
3097                           <DialogHeader>
3098                             <DialogTitle className="text-white flex items-center">
3099                               <Image
3100                                 src="/new-blue-logo.png"
3101                                 alt="Sycord"
3102                                 width={20}
3103                                 height={20}
3104                                 className="rounded mr-2"
3105                               />
3106                               Reputation System
3107                             </DialogTitle>
3108                             <DialogDescription className="text-gray-400">
3109                               How our staff reputation system works
3110                             </DialogDescription>
3111                           </DialogHeader>
3112                           <div className="text-gray-300 space-y-3 text-sm">
3113                             <p>
3114                               The reputation system tracks staff performance and prevents abuse of moderation powers.
3115                             </p>
3116                             <p>
3117                               Staff members start with a configurable max reputation. Each moderation action (kicks,
3118                               bans, timeouts) reduces reputation by 1 point.
3119                             </p>
3120                             <p>
3121                               When reputation reaches 0, the staff member is temporarily blocked from performing
3122                               moderation actions until their reputation resets.
3123                             </p>
3124                             <p>
3125                               Reputation automatically resets to max reputation every 24 hours to allow continued
3126                               moderation while preventing spam actions.
3127                             </p>
3128                           </div>
3129                         </DialogContent>
3130                       </Dialog>
3131                     </div>
3132                   </CardHeader>
3133                   <CardContent className="space-y-4">
3134                     <div className="flex items-center justify-between">
3135                       <h3 className="text-lg font-medium text-white">Staff Members</h3>
3136                       <div className="flex items-center space-x-2">
3137                         <Label htmlFor="max-rep" className="text-white text-sm">
3138                           Max Rep:
3139                         </Label>
3140                         <Input
3141                           id="max-rep"
3142                           type="number"
3143                           min="1"
3144                           max="100"
3145                           value={serverConfig.support.max_reputation_score}
3146                           onChange={(e) =>
3147                             updateServerConfig({
3148                               support: {
3149                                 ...serverConfig.support,
3150                                 max_reputation_score: Number.parseInt(e.target.value) || 20,
3151                               },
3152                             })
3153                           }
3154                           className="bg-black/60 border-white/20 text-white h-7 w-20 text-xs"
3155                         />
3156                       </div>
3157                     </div>
3158 
3159                     {/* Staff List */}
3160                     <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
3161                       {serverConfig.support?.staff?.length > 0 ? (
3162                         serverConfig.support.staff.map((staff) => (
3163                           <div
3164                             key={staff.userId}
3165                             className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-black/20"
3166                           >
3167                             <div className="flex items-center space-x-3">
3168                               <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
3169                                 <Users className="h-5 w-5 text-gray-400" />
3170                               </div>
3171                               <div>
3172                                 <h4 className="font-medium text-white">{staff.username}</h4>
3173                               </div>
3174                             </div>
3175 
3176                             <div className="flex items-center space-x-4">
3177                               {/* Reputation Bar with Sycord Logo */}
3178                               {serverConfig.support.reputation_enabled && (
3179                                 <div className="flex items-center space-x-2">
3180                                   <Image
3181                                     src="/new-blue-logo.png"
3182                                     alt="Sycord"
3183                                     width={16}
3184                                     height={16}
3185                                     className="rounded"
3186                                   />
3187                                   <div className="w-24">
3188                                     <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
3189                                       <span>Rep.</span>
3190                                       <span>
3191                                         {staff.reputation}/{serverConfig.support.max_reputation_score}
3192                                       </span>
3193                                     </div>
3194                                     <Progress
3195                                       value={(staff.reputation / serverConfig.support.max_reputation_score) * 100}
3196                                       className="h-2 bg-gray-800"
3197                                       indicatorClassName="bg-blue-800"
3198                                     />
3199                                   </div>
3200                                 </div>
3201                               )}
3202 
3203                               {/* Flag Staff Button */}
3204                               <Button
3205                                 onClick={() => handleFlagStaffClick(staff.userId)}
3206                                 variant="outline"
3207                                 size="sm"
3208                                 className="border-red-500/50 text-red-400 hover:bg-red-500/10"
3209                                 disabled={staff.reputation === 0}
3210                               >
3211                                 <Flag className="h-4 w-4 text-white" />
3212                               </Button>
3213                             </div>
3214                           </div>
3215                         ))
3216                       ) : (
3217                         <div className="text-center py-8">
3218                           <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
3219                           <p className="text-gray-400">No staff members found</p>
3220                           <p className="text-sm text-gray-500">
3221                             Staff members will appear here automatically when they join your server
3222                           </p>
3223                         </div>
3224                       )}
3225                     </div>
3226                     <div className="flex items-center justify-between pt-4">
3227                       <div>
3228                         <h3 className="font-medium text-white text-base">Enable Reputation System</h3>
3229                         <p className="text-sm text-gray-400">Track and manage staff reputation</p>
3230                       </div>
3231                       <Switch
3232                         checked={serverConfig.support.reputation_enabled}
3233                         onCheckedChange={(checked) =>
3234                           updateServerConfig({
3235                             support: {
3236                               ...serverConfig.support,
3237                               reputation_enabled: checked,
3238                             },
3239                           })
3240                         }
3241                       />
3242                     </div>
3243                   </CardContent>
3244                 </Card>
3245               </div>
3246             )}
3247 
3248             {/* Flag Staff Warning Dialog */}
3249             <Dialog open={showFlagStaffWarning} onOpenChange={setShowFlagStaffWarning}>
3250               <DialogContent className="glass-card max-w-md">
3251                 <DialogHeader>
3252                   <DialogTitle className="text-white flex items-center">
3253                     <Flag className="h-5 w-5 mr-2 text-white" />
3254                     Flag Staff Member
3255                   </DialogTitle>
3256                   <DialogDescription className="text-gray-400">
3257                     Are you sure you want to flag this staff member?
3258                   </DialogDescription>
3259                 </DialogHeader>
3260                 <div className="space-y-4">
3261                   <p className="text-gray-300">
3262                     Flagging a staff member will reduce their reputation score to 5. This action is irreversible for the
3263                     current reputation cycle.
3264                   </p>
3265                 </div>
3266                 <DialogFooter>
3267                   <Button
3268                     variant="outline"
3269                     onClick={() => setShowFlagStaffWarning(false)}
3270                     className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
3271                   >
3272                     Cancel
3273                   </Button>
3274                   <Button onClick={confirmFlagStaff} className="bg-white text-black hover:bg-gray-100">
3275                     Flag Staff
3276                   </Button>
3277                 </DialogFooter>
3278               </DialogContent>
3279             </Dialog>
3280 
3281             {/* Ticket System */}
3282             {activeSupportSection === "tickets" && (
3283               <Card className="glass-card">
3284                 <CardHeader>
3285                   <CardTitle className="text-white flex items-center text-xl">
3286                     <MessageSquare className="h-6 w-6 mr-3" />
3287                     Ticket System
3288                   </CardTitle>
3289                   <CardDescription className="text-gray-400">
3290                     Configure ticket system and customize embed appearance
3291                   </CardDescription>
3292                 </CardHeader>
3293                 <CardContent className="space-y-6">
3294                   <div className="flex items-center justify-between">
3295                     <div>
3296                       <h3 className="font-medium text-white text-base">Enable Ticket System</h3>
3297                       <p className="text-sm text-gray-400">Allow users to create support tickets</p>
3298                     </div>
3299                     <Switch
3300                       checked={serverConfig.support?.ticket_system?.enabled || false}
3301                       onCheckedChange={(checked) =>
3302                         updateServerConfig({
3303                           support: {
3304                             ...serverConfig.support,
3305                             ticket_system: {
3306                               ...serverConfig.support.ticket_system,
3307                               enabled: checked,
3308                               embed: serverConfig.support?.ticket_system?.embed || {
3309                                 title: "Support Ticket",
3310                                 description: "Click the button below to create a support ticket.",
3311                                 color: "#5865F2",
3312                                 footer: "Support Team",
3313                               },
3314                               settings: serverConfig.support?.ticket_system?.settings || {
3315                                 autoAnswer: { enabled: false, qa_pairs: "" },
3316                                 blockedUsers: { enabled: false, userIds: [] },
3317                                 inactivityClose: { enabled: false, timeoutMinutes: 30 },
3318                                 logging: { enabled: false },
3319                               },
3320                             },
3321                           },
3322                         })
3323                       }
3324                     />
3325                   </div>
3326 
3327                   {serverConfig.support?.ticket_system?.enabled && (
3328                     <div className="space-y-6">
3329                       {/* Embed Preview - Top */}
3330                       <div className="space-y-4">
3331                         <div className="flex items-center justify-between">
3332                           <h4 className="text-white font-medium">Embed Preview</h4>
3333                           <Dialog open={showEmbedSettings} onOpenChange={setShowEmbedSettings}>
3334                             <DialogTrigger asChild>
3335                               <Button
3336                                 variant="outline"
3337                                 size="sm"
3338                                 className="border-white/20 text-white hover:bg-gray-100 hover:text-gray-900 bg-transparent"
3339                               >
3340                                 <Settings className="h-4 w-4 mr-2 text-white" />
3341                                 Customize
3342                               </Button>
3343                             </DialogTrigger>
3344                             <DialogContent className="glass-card max-w-2xl">
3345                               <DialogHeader>
3346                                 <DialogTitle className="text-white">Customize Embed</DialogTitle>
3347                                 <DialogDescription className="text-gray-400">
3348                                   Customize the appearance of your ticket embed
3349                                 </DialogDescription>
3350                               </DialogHeader>
3351                               <div className="space-y-4">
3352                                 <div>
3353                                   <Label className="text-white text-sm mb-2 block">Title</Label>
3354                                   <Input
3355                                     placeholder="Support Ticket"
3356                                     value={serverConfig.support.ticket_system.embed?.title || ""}
3357                                     onChange={(e) =>
3358                                       updateServerConfig({
3359                                         support: {
3360                                           ...serverConfig.support,
3361                                           ticket_system: {
3362                                             ...serverConfig.support.ticket_system.embed,
3363                                             title: e.target.value,
3364                                           },
3365                                         },
3366                                       })
3367                                     }
3368                                     className="bg-black/60 border-white/20 text-white placeholder-gray-400"
3369                                   />
3370                                 </div>
3371 
3372                                 <div>
3373                                   <Label className="text-white text-sm mb-2 block">Description</Label>
3374                                   <Textarea
3375                                     placeholder="Click the button below to create a support ticket."
3376                                     value={serverConfig.support.ticket_system.embed?.description || ""}
3377                                     onChange={(e) =>
3378                                       updateServerConfig({
3379                                         support: {
3380                                           ...serverConfig.support,
3381                                           ticket_system: {
3382                                             ...serverConfig.support.ticket_system.embed,
3383                                             description: e.target.value,
3384                                           },
3385                                         },
3386                                       })
3387                                     }
3388                                     className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[100px]"
3389                                   />
3390                                 </div>
3391 
3392                                 <div className="grid grid-cols-2 gap-4">
3393                                   <div>
3394                                     <Label className="text-white text-sm mb-2 block">Color</Label>
3395                                     <Input
3396                                       type="color"
3397                                       value={serverConfig.support.ticket_system.embed?.color || "#5865F2"}
3398                                       onChange={(e) =>
3399                                         updateServerConfig({
3400                                           support: {
3401                                             ...serverConfig.support,
3402                                             ticket_system: {
3403                                               ...serverConfig.support.ticket_system.embed,
3404                                               color: e.target.value,
3405                                             },
3406                                           },
3407                                         })
3408                                       }
3409                                       className="bg-black/60 border-white/20 h-10"
3410                                     />
3411                                   </div>
3412 
3413                                   <div>
3414                                     <Label className="text-white text-sm mb-2 block">Thumbnail URL</Label>
3415                                     <Input
3416                                       placeholder="https://example.com/image.png"
3417                                       value={serverConfig.support.ticket_system.embed?.thumbnail || ""}
3418                                       onChange={(e) =>
3419                                         updateServerConfig({
3420                                           support: {
3421                                             ...serverConfig.support,
3422                                             ticket_system: {
3423                                               ...serverConfig.support.ticket_system.embed,
3424                                               thumbnail: e.target.value,
3425                                             },
3426                                           },
3427                                         })
3428                                       }
3429                                       className="bg-black/60 border-white/20 text-white placeholder-gray-400"
3430                                     />
3431                                   </div>
3432                                 </div>
3433 
3434                                 <div>
3435                                   <Label className="text-white text-sm mb-2 block">Footer Text</Label>
3436                                   <Input
3437                                     placeholder="Support Team"
3438                                     value={serverConfig.support.ticket_system.embed?.footer || ""}
3439                                     onChange={(e) =>
3440                                       updateServerConfig({
3441                                         support: {
3442                                           ...serverConfig.support,
3443                                           ticket_system: {
3444                                             ...serverConfig.support.ticket_system.embed,
3445                                             footer: e.target.value,
3446                                           },
3447                                         },
3448                                       })
3449                                     }
3450                                     className="bg-black/60 border-white/20 text-white placeholder-gray-400"
3451                                   />
3452                                 </div>
3453                               </div>
3454                             </DialogContent>
3455                           </Dialog>
3456                         </div>
3457 
3458                         {/* Preview */}
3459                         <div
3460                           className="border-l-4 bg-gray-800/50 p-4 rounded-r-lg"
3461                           style={{ borderLeftColor: serverConfig.support.ticket_system.embed?.color || "#5865F2" }}
3462                         >
3463                           <div className="flex items-start justify-between">
3464                             <div className="flex-1">
3465                               {serverConfig.support.ticket_system.embed?.title && (
3466                                 <h3 className="text-white font-semibold mb-2">
3467                                   {serverConfig.support.ticket_system.embed?.title}
3468                                 </h3>
3469                               )}
3470                               {serverConfig.support.ticket_system.embed?.description && (
3471                                 <p className="text-gray-300">{serverConfig.support.ticket_system.embed?.description}</p>
3472                               )}
3473                             </div>
3474                             {serverConfig.support.ticket_system.embed?.thumbnail && (
3475                               <div className="ml-4">
3476                                 <Image
3477                                   src={serverConfig.support.ticket_system.embed?.thumbnail || "/placeholder.svg"}
3478                                   alt="Thumbnail"
3479                                   width={50}
3480                                   height={50}
3481                                   className="rounded-md"
3482                                 />
3483                               </div>
3484                             )}
3485                           </div>
3486                           {serverConfig.support.ticket_system.embed?.footer && (
3487                             <p className="text-gray-400 text-sm mt-2">
3488                               {serverConfig.support.ticket_system.embed?.footer}
3489                             </p>
3490                           )}
3491                         </div>
3492                       </div>
3493 
3494                       {/* Category Select */}
3495                       <div>
3496                         <Label className="text-white text-sm mb-2 block">Ticket Category</Label>
3497                         <Select
3498                           value={serverConfig.support?.ticket_system?.channel_id || ""}
3499                           onValueChange={(value) =>
3500                             updateServerConfig({
3501                               support: {
3502                                 ...serverConfig.support,
3503                                 ticket_system: {
3504                                   ...serverConfig.support.ticket_system,
3505                                   channel_id: value,
3506                                 },
3507                               },
3508                             })
3509                           }
3510                         >
3511                           <SelectTrigger className="bg-black/60 border-white/20 h-8">
3512                             <SelectValue placeholder="Select a category" />
3513                           </SelectTrigger>
3514                           <SelectContent>
3515                             {serverConfig.channels &&
3516                               Object.entries(serverConfig.channels).map(([channelId, channelName]) => (
3517                                 <SelectItem key={channelId} value={channelId}>
3518                                   {channelName}
3519                                 </SelectItem>
3520                               ))}
3521                           </SelectContent>
3522                         </Select>
3523                       </div>
3524 
3525                       {/* Send Embed Button */}
3526                       <Button onClick={sendTicketEmbed} className="bg-white text-black hover:bg-gray-100">
3527                         Send Ticket Embed
3528                       </Button>
3529                     </div>
3530                   )}
3531                 </CardContent>
3532               </Card>
3533             )}
3534           </div>
3535         )}
3536 
3537         {/* Events Tab */}
3538         {activeTab === "events" && <div className="space-y-6">{renderEventContent()}</div>}
3539 
3540         {/* Integrations Tab */}
3541         {activeTab === "integrations" && (
3542           <div className="space-y-6">
3543             <Card className="glass-card">
3544               <CardHeader>
3545                 <CardTitle className="text-white flex items-center text-xl">
3546                   <LinkIcon className="h-6 w-6 mr-3" />
3547                   Integrations
3548                 </CardTitle>
3549                 <CardDescription className="text-gray-400">
3550                   Connect your server with other services and platforms
3551                 </CardDescription>
3552               </CardHeader>
3553               <CardContent className="space-y-6">
3554                 <p className="text-gray-400">Integrations are coming soon! Stay tuned for updates.</p>
3555               </CardContent>
3556             </Card>
3557           </div>
3558         )}
3559 
3560         {/* Plugins Tab */}
3561         {activeTab === "plugins" && <PluginsTab serverId={serverId} />}
3562 
3563         {/* Settings Tab */}
3564         {activeTab === "settings" && (
3565           <div className="space-y-6">
3566             {/* Bot Profile Header */}
3567             <Card className="glass-card">
3568               <CardHeader>
3569                 <CardTitle className="text-white flex items-center text-xl">
3570                   <Bot className="h-6 w-6 mr-3" />
3571                   Bot Configuration
3572                 </CardTitle>
3573                 <CardDescription className="text-gray-400">
3574                   Customize your bot's appearance and settings
3575                 </CardDescription>
3576               </CardHeader>
3577               <CardContent className="space-y-6">
3578                 <div className="flex items-center space-x-6">
3579                   {/* Bot Avatar */}
3580                   <div className="relative">
3581                     <Avatar className="w-20 h-20 border-4 border-blue-500">
3582                       <AvatarImage src={profilePictureUrl || "/placeholder.svg"} alt="Bot Avatar" />
3583                       <AvatarFallback className="text-2xl font-bold bg-blue-800 text-white">
3584                         {customBotName ? customBotName.charAt(0) : "S"}
3585                       </AvatarFallback>
3586                     </Avatar>
3587                     <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background"></div>
3588                   </div>
3589 
3590                   {/* Bot Info */}
3591                   <div className="flex-1">
3592                     <h2 className="text-2xl font-bold text-white mb-1">{customBotName || "Sycord"}</h2>
3593                     <p className="text-gray-400 mb-2">Discord Bot</p>
3594                     <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
3595                       <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
3596                       Online
3597                     </Badge>
3598                   </div>
3599                 </div>
3600 
3601                 {/* Customization Form */}
3602                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
3603                   <div>
3604                     <Label className="text-white text-sm mb-2 block">Bot Name</Label>
3605                     <Input
3606                       placeholder="Enter bot name"
3607                       value={customBotName}
3608                       onChange={(e) => setCustomBotName(e.target.value)}
3609                       className="bg-black/60 border-white/20 text-white placeholder-gray-400"
3610                     />
3611                   </div>
3612                   <div>
3613                     <Label className="text-white text-sm mb-2 block">Profile Picture URL</Label>
3614                     <Input
3615                       placeholder="https://example.com/avatar.png"
3616                       value={profilePictureUrl}
3617                       onChange={(e) => setProfilePictureUrl(e.target.value)}
3618                       className="bg-black/60 border-white/20 text-white placeholder-gray-400"
3619                     />
3620                   </div>
3621                 </div>
3622 
3623                 <div>
3624                   <Label className="text-white text-sm mb-2 block">Bot Token (Optional)</Label>
3625                   <div className="relative">
3626                     <Input
3627                       type={showToken ? "text" : "password"}
3628                       placeholder="Enter bot token for custom bot"
3629                       value={botToken}
3630                       onChange={(e) => setBotToken(e.target.value)}
3631                       className="bg-black/60 border-white/20 text-white placeholder-gray-400 pr-10"
3632                     />
3633                     <Button
3634                       type="button"
3635                       variant="ghost"
3636                       size="icon"
3637                       className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
3638                       onClick={() => setShowToken(!showToken)}
3639                     >
3640                       {showToken ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
3641                     </Button>
3642                   </div>
3643                   <p className="text-xs text-gray-400 mt-1">Leave empty to use the default Sycord bot</p>
3644                 </div>
3645 
3646                 <Button onClick={handleSaveBotSettings} className="bg-white text-black hover:bg-gray-100">
3647                   Save Bot Settings
3648                 </Button>
3649               </CardContent>
3650             </Card>
3651 
3652             {/* Settings Options */}
3653             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
3654               <Card className="glass-card cursor-pointer hover:bg-white/5 transition-colors group">
3655                 <CardHeader className="text-center">
3656                   <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
3657                     <Mail className="w-6 h-6 text-red-400" />
3658                   </div>
3659                   <CardTitle className="text-white">Report Problem</CardTitle>
3660                   <CardDescription className="text-gray-400">Contact our support team for assistance</CardDescription>
3661                 </CardHeader>
3662                 <CardContent>
3663                   <Button
3664                     className="w-full bg-transparent border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
3665                     variant="outline"
3666                     onClick={() => window.open("mailto:support@sycord.com", "_blank")}
3667                   >
3668                     <LinkIcon className="w-4 h-4 mr-2" />
3669                     Email Support
3670                   </Button>
3671                 </CardContent>
3672               </Card>
3673 
3674               <Card className="glass-card cursor-pointer hover:bg-white/5 transition-colors group">
3675                 <CardHeader className="text-center">
3676                   <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
3677                     <Download className="w-6 h-6 text-green-400" />
3678                   </div>
3679                   <CardTitle className="text-white">Manage Data</CardTitle>
3680                   <CardDescription className="text-gray-400">Download your collected user data as JSON</CardDescription>
3681                 </CardHeader>
3682                 <CardContent>
3683                   <Button
3684                     className="w-full bg-transparent border-white/20 text-white hover:bg-gray-100 hover:text-gray-900"
3685                     variant="outline"
3686                     onClick={downloadUserData}
3687                   >
3688                     <Download className="w-4 h-4 mr-2" />
3689                     Download Data
3690                   </Button>
3691                 </CardContent>
3692               </Card>
3693             </div>
3694 
3695             {/* Footer with Terms and Privacy */}
3696             <Card className="glass-card">
3697               <CardContent className="p-6">
3698                 <div className="text-center space-y-4">
3699                   <div className="flex items-center justify-center space-x-6 text-sm">
3700                     <Button variant="link" size="sm" className="text-gray-400 hover:text-white p-0">
3701                       Terms of Service
3702                     </Button>
3703                     <Button variant="link" size="sm" className="text-gray-400 hover:text-white p-0">
3704                       Privacy Policy
3705                     </Button>
3706                     <Button variant="link" size="sm" className="text-gray-400 hover:text-white p-0">
3707                       Support
3708                     </Button>
3709                   </div>
3710                   <Separator className="bg-white/20" />
3711                   <div className="text-xs text-gray-500">
3712                     <p>© 2024 Sycord. All rights reserved.</p>
3713                     <p className="mt-1">
3714                       We collect minimal data necessary for bot functionality. Your data is never sold or shared with
3715                       third parties.
3716                     </p>
3717                   </div>
3718                 </div>
3719               </CardContent>
3720             </Card>
3721           </div>
3722         )}
3723 
3724         {/* Access+ Tab */}
3725         {activeTab === "access-plus" && session?.user?.email === "dmarton336@gmail.com" && (
3726           <div className="space-y-6">
3727             {/* App Settings */}
3728             <Card className="glass-card">
3729               <CardHeader>
3730                 <CardTitle className="text-white flex items-center text-xl">
3731                   <Settings className="h-6 w-6 mr-3" />
3732                   App Settings
3733                 </CardTitle>
3734                 <CardDescription className="text-gray-400">Manage global app settings</CardDescription>
3735               </CardHeader>
3736               <CardContent className="space-y-6">
3737                 <div className="flex items-center justify-between">
3738                   <div>
3739                     <Label htmlFor="maintenance-mode" className="text-white">
3740                       Maintenance Mode
3741                     </Label>
3742                     <p className="text-sm text-gray-400">Enable or disable maintenance mode for the entire app</p>
3743                   </div>
3744                   <Switch
3745                     id="maintenance-mode"
3746                     checked={appSettings?.maintenanceMode.enabled || false}
3747                     onCheckedChange={handleMaintenanceToggle}
3748                   />
3749                 </div>
3750               </CardContent>
3751             </Card>
3752 
3753             {/* Announcements */}
3754             <Card className="glass-card">
3755               <CardHeader>
3756                 <CardTitle className="text-white flex items-center text-xl">
3757                   <Megaphone className="h-6 w-6 mr-3" />
3758                   Announcements
3759                 </CardTitle>
3760                 <CardDescription className="text-gray-400">Send global announcements to all users</CardDescription>
3761               </CardHeader>
3762               <CardContent className="space-y-6">
3763                 <div>
3764                   <Label htmlFor="new-announcement" className="text-white">
3765                     New Announcement
3766                   </Label>
3767                   <Textarea
3768                     id="new-announcement"
3769                     placeholder="Enter your announcement message"
3770                     value={newAnnouncement}
3771                     onChange={(e) => setNewAnnouncement(e.target.value)}
3772                     className="bg-black/60 border-white/20 text-white placeholder-gray-400 min-h-[80px]"
3773                   />
3774                 </div>
3775                 <Button onClick={handleSendAnnouncement} className="bg-white text-black hover:bg-gray-100">
3776                   Send Announcement
3777                 </Button>
3778               </CardContent>
3779             </Card>
3780           </div>
3781         )}
3782       </div>
3783     </div>
3784   )
3785 }
3786 