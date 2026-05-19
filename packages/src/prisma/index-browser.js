
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.TenantScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  resellerId: 'resellerId'
};

exports.Prisma.ResellerScalarFieldEnum = {
  id: 'id',
  name: 'name',
  domain: 'domain',
  logoUrl: 'logoUrl',
  primaryColor: 'primaryColor',
  accentColor: 'accentColor',
  theme: 'theme',
  hidePoweredBy: 'hidePoweredBy',
  smtpHost: 'smtpHost',
  smtpPort: 'smtpPort',
  smtpUser: 'smtpUser',
  smtpPass: 'smtpPass',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  avatarUrl: 'avatarUrl',
  role: 'role',
  passwordHash: 'passwordHash',
  isActive: 'isActive',
  emailVerified: 'emailVerified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  token: 'token',
  expiresAt: 'expiresAt',
  revokedAt: 'revokedAt',
  createdAt: 'createdAt',
  userId: 'userId'
};

exports.Prisma.SubscriptionScalarFieldEnum = {
  id: 'id',
  status: 'status',
  trialEndsAt: 'trialEndsAt',
  currentPeriodStart: 'currentPeriodStart',
  currentPeriodEnd: 'currentPeriodEnd',
  cancelAtPeriodEnd: 'cancelAtPeriodEnd',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId',
  planId: 'planId'
};

exports.Prisma.PlanScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  price: 'price',
  currency: 'currency',
  interval: 'interval',
  isPublic: 'isPublic',
  maxMessages: 'maxMessages',
  maxContacts: 'maxContacts',
  maxCampaigns: 'maxCampaigns',
  maxAiTokens: 'maxAiTokens',
  maxStorage: 'maxStorage',
  features: 'features',
  stripePriceId: 'stripePriceId',
  razorpayPlanId: 'razorpayPlanId',
  paypalPlanId: 'paypalPlanId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  resellerId: 'resellerId'
};

exports.Prisma.CouponScalarFieldEnum = {
  id: 'id',
  code: 'code',
  discountType: 'discountType',
  discountValue: 'discountValue',
  maxUses: 'maxUses',
  usedCount: 'usedCount',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  planId: 'planId',
  tenantId: 'tenantId'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  invoiceNumber: 'invoiceNumber',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  dueDate: 'dueDate',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId',
  subscriptionId: 'subscriptionId',
  couponId: 'couponId'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  id: 'id',
  token: 'token',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  userId: 'userId'
};

exports.Prisma.PasswordResetScalarFieldEnum = {
  id: 'id',
  token: 'token',
  expiresAt: 'expiresAt',
  usedAt: 'usedAt',
  createdAt: 'createdAt',
  userId: 'userId'
};

exports.Prisma.WhatsAppNumberScalarFieldEnum = {
  id: 'id',
  phoneNumberId: 'phoneNumberId',
  displayName: 'displayName',
  status: 'status',
  qualityRating: 'qualityRating',
  messagingTier: 'messagingTier',
  accessToken: 'accessToken',
  wabaId: 'wabaId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId'
};

exports.Prisma.ConversationScalarFieldEnum = {
  id: 'id',
  status: 'status',
  assignedToId: 'assignedToId',
  lastMessageAt: 'lastMessageAt',
  windowOpenAt: 'windowOpenAt',
  windowClosesAt: 'windowClosesAt',
  snoozedUntil: 'snoozedUntil',
  aiPaused: 'aiPaused',
  humanTookOver: 'humanTookOver',
  summary: 'summary',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId',
  whatsAppNumberId: 'whatsAppNumberId',
  contactId: 'contactId',
  userId: 'userId'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  direction: 'direction',
  type: 'type',
  content: 'content',
  mediaUrl: 'mediaUrl',
  mediaType: 'mediaType',
  mediaId: 'mediaId',
  caption: 'caption',
  status: 'status',
  isAiGenerated: 'isAiGenerated',
  metaMessageId: 'metaMessageId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId',
  conversationId: 'conversationId',
  contactId: 'contactId'
};

exports.Prisma.ContactScalarFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  company: 'company',
  avatarUrl: 'avatarUrl',
  optStatus: 'optStatus',
  isBlocked: 'isBlocked',
  lastSeenAt: 'lastSeenAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId'
};

exports.Prisma.TagScalarFieldEnum = {
  id: 'id',
  name: 'name',
  color: 'color',
  createdAt: 'createdAt',
  tenantId: 'tenantId'
};

exports.Prisma.ContactTagScalarFieldEnum = {
  contactId: 'contactId',
  tagId: 'tagId'
};

exports.Prisma.CustomFieldScalarFieldEnum = {
  id: 'id',
  key: 'key',
  label: 'label',
  fieldType: 'fieldType',
  options: 'options',
  isRequired: 'isRequired',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId'
};

exports.Prisma.ContactCustomFieldValueScalarFieldEnum = {
  contactId: 'contactId',
  customFieldId: 'customFieldId',
  value: 'value'
};

exports.Prisma.ConversationNoteScalarFieldEnum = {
  id: 'id',
  content: 'content',
  createdAt: 'createdAt',
  conversationId: 'conversationId',
  userId: 'userId'
};

exports.Prisma.ContactNoteScalarFieldEnum = {
  id: 'id',
  content: 'content',
  createdAt: 'createdAt',
  contactId: 'contactId',
  userId: 'userId'
};

exports.Prisma.AIConfigScalarFieldEnum = {
  id: 'id',
  provider: 'provider',
  model: 'model',
  systemPrompt: 'systemPrompt',
  autoReplyEnabled: 'autoReplyEnabled',
  autoReplyDelay: 'autoReplyDelay',
  confidenceThreshold: 'confidenceThreshold',
  shortTermLimit: 'shortTermLimit',
  summarizeAfter: 'summarizeAfter',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId',
  whatsAppNumberId: 'whatsAppNumberId'
};

exports.Prisma.FeatureFlagScalarFieldEnum = {
  id: 'id',
  feature: 'feature',
  enabled: 'enabled',
  createdAt: 'createdAt',
  tenantId: 'tenantId'
};

exports.Prisma.AutomationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId',
  trigger: 'trigger',
  triggerConfig: 'triggerConfig',
  nodes: 'nodes',
  edges: 'edges'
};

exports.Prisma.AutomationRunScalarFieldEnum = {
  id: 'id',
  status: 'status',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  nodeResults: 'nodeResults',
  error: 'error',
  automationId: 'automationId',
  tenantId: 'tenantId',
  conversationId: 'conversationId',
  contactId: 'contactId'
};

exports.Prisma.CampaignScalarFieldEnum = {
  id: 'id',
  name: 'name',
  status: 'status',
  scheduledAt: 'scheduledAt',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId',
  templateId: 'templateId',
  whatsAppNumberId: 'whatsAppNumberId'
};

exports.Prisma.CampaignRecipientScalarFieldEnum = {
  id: 'id',
  status: 'status',
  sentAt: 'sentAt',
  deliveredAt: 'deliveredAt',
  readAt: 'readAt',
  failedReason: 'failedReason',
  campaignId: 'campaignId',
  contactId: 'contactId'
};

exports.Prisma.TemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  category: 'category',
  language: 'language',
  status: 'status',
  metaTemplateId: 'metaTemplateId',
  components: 'components',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId'
};

exports.Prisma.PageScalarFieldEnum = {
  id: 'id',
  slug: 'slug',
  title: 'title',
  content: 'content',
  css: 'css',
  isHomepage: 'isHomepage',
  status: 'status',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId'
};

exports.Prisma.ApiKeyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  keyPrefix: 'keyPrefix',
  keyHash: 'keyHash',
  permissions: 'permissions',
  lastUsedAt: 'lastUsedAt',
  createdAt: 'createdAt',
  tenantId: 'tenantId'
};

exports.Prisma.WebhookEndpointScalarFieldEnum = {
  id: 'id',
  url: 'url',
  events: 'events',
  isActive: 'isActive',
  lastDeliveryAt: 'lastDeliveryAt',
  failureCount: 'failureCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId'
};

exports.Prisma.WebhookEventScalarFieldEnum = {
  id: 'id',
  eventType: 'eventType',
  source: 'source',
  payload: 'payload',
  processed: 'processed',
  createdAt: 'createdAt',
  tenantId: 'tenantId'
};

exports.Prisma.WebhookDeliveryScalarFieldEnum = {
  id: 'id',
  eventId: 'eventId',
  endpointId: 'endpointId',
  status: 'status',
  responseCode: 'responseCode',
  responseBody: 'responseBody',
  attempts: 'attempts',
  lastAttemptAt: 'lastAttemptAt',
  createdAt: 'createdAt'
};

exports.Prisma.AnalyticsEventScalarFieldEnum = {
  id: 'id',
  eventType: 'eventType',
  eventData: 'eventData',
  createdAt: 'createdAt',
  tenantId: 'tenantId'
};

exports.Prisma.DailyMetricScalarFieldEnum = {
  id: 'id',
  date: 'date',
  metricType: 'metricType',
  value: 'value',
  tenantId: 'tenantId'
};

exports.Prisma.AIUsageLogScalarFieldEnum = {
  id: 'id',
  provider: 'provider',
  model: 'model',
  promptTokens: 'promptTokens',
  completionTokens: 'completionTokens',
  totalTokens: 'totalTokens',
  cost: 'cost',
  latency: 'latency',
  createdAt: 'createdAt',
  tenantId: 'tenantId'
};

exports.Prisma.AIMemoryScalarFieldEnum = {
  id: 'id',
  contactId: 'contactId',
  summary: 'summary',
  lastUpdatedAt: 'lastUpdatedAt',
  tenantId: 'tenantId'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  type: 'type',
  title: 'title',
  body: 'body',
  actionUrl: 'actionUrl',
  isRead: 'isRead',
  createdAt: 'createdAt',
  userId: 'userId',
  tenantId: 'tenantId'
};

exports.Prisma.NotificationPreferenceScalarFieldEnum = {
  type: 'type',
  channel: 'channel',
  enabled: 'enabled',
  userId: 'userId'
};

exports.Prisma.OnboardingStepScalarFieldEnum = {
  id: 'id',
  step: 'step',
  completed: 'completed',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  tenantId: 'tenantId'
};

exports.Prisma.DealScalarFieldEnum = {
  id: 'id',
  title: 'title',
  value: 'value',
  currency: 'currency',
  stage: 'stage',
  probability: 'probability',
  expectedCloseDate: 'expectedCloseDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  contactId: 'contactId',
  tenantId: 'tenantId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TENANT_OWNER: 'TENANT_OWNER',
  AGENT: 'AGENT',
  BOT: 'BOT'
};

exports.SubscriptionStatus = exports.$Enums.SubscriptionStatus = {
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  GRACE_PERIOD: 'GRACE_PERIOD',
  CANCELLED: 'CANCELLED'
};

exports.PlanType = exports.$Enums.PlanType = {
  FREE: 'FREE',
  TRIAL: 'TRIAL',
  BASIC: 'BASIC',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE'
};

exports.InvoiceStatus = exports.$Enums.InvoiceStatus = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  PAID: 'PAID',
  VOID: 'VOID',
  UNCOLLECTIBLE: 'UNCOLLECTIBLE'
};

exports.WhatsAppNumberStatus = exports.$Enums.WhatsAppNumberStatus = {
  ACTIVE: 'ACTIVE',
  DISCONNECTED: 'DISCONNECTED',
  FLAGGED: 'FLAGGED'
};

exports.OptStatus = exports.$Enums.OptStatus = {
  OPTED_IN: 'OPTED_IN',
  OPTED_OUT: 'OPTED_OUT'
};

exports.AIProvider = exports.$Enums.AIProvider = {
  OPENROUTER: 'OPENROUTER',
  OPENAI: 'OPENAI',
  ANTHROPIC: 'ANTHROPIC',
  GOOGLE: 'GOOGLE',
  GROQ: 'GROQ',
  DEEPSEEK: 'DEEPSEEK',
  QWEN: 'QWEN',
  OLLAMA: 'OLLAMA'
};

exports.AutomationTrigger = exports.$Enums.AutomationTrigger = {
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  KEYWORD_MATCH: 'KEYWORD_MATCH',
  TAG_ADDED: 'TAG_ADDED',
  TAG_REMOVED: 'TAG_REMOVED',
  CONTACT_CREATED: 'CONTACT_CREATED',
  INACTIVITY: 'INACTIVITY',
  SCHEDULED: 'SCHEDULED',
  CONVERSATION_ASSIGNED: 'CONVERSATION_ASSIGNED',
  CONVERSATION_RESOLVED: 'CONVERSATION_RESOLVED',
  BUTTON_CLICKED: 'BUTTON_CLICKED',
  FLOW_SUBMITTED: 'FLOW_SUBMITTED'
};

exports.CampaignStatus = exports.$Enums.CampaignStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.CampaignRecipientStatus = exports.$Enums.CampaignRecipientStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
  OPTED_OUT: 'OPTED_OUT'
};

exports.TemplateCategory = exports.$Enums.TemplateCategory = {
  MARKETING: 'MARKETING',
  UTILITY: 'UTILITY',
  AUTHENTICATION: 'AUTHENTICATION'
};

exports.TemplateStatus = exports.$Enums.TemplateStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.PageStatus = exports.$Enums.PageStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED'
};

exports.WebhookEventType = exports.$Enums.WebhookEventType = {
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  MESSAGE_SENT: 'MESSAGE_SENT',
  MESSAGE_DELIVERED: 'MESSAGE_DELIVERED',
  MESSAGE_READ: 'MESSAGE_READ',
  MESSAGE_FAILED: 'MESSAGE_FAILED',
  CONTACT_CREATED: 'CONTACT_CREATED',
  TAG_ADDED: 'TAG_ADDED',
  TAG_REMOVED: 'TAG_REMOVED',
  CAMPAIGN_SENT: 'CAMPAIGN_SENT',
  CAMPAIGN_DELIVERED: 'CAMPAIGN_DELIVERED',
  CAMPAIGN_READ: 'CAMPAIGN_READ',
  CAMPAIGN_OPT_OUT: 'CAMPAIGN_OPT_OUT',
  SUBSCRIPTION_CREATED: 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED: 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  PAYMENT_SUCCEEDED: 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED: 'PAYMENT_FAILED'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS'
};

exports.NotificationChannel = exports.$Enums.NotificationChannel = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP'
};

exports.Prisma.ModelName = {
  Tenant: 'Tenant',
  Reseller: 'Reseller',
  User: 'User',
  Session: 'Session',
  Subscription: 'Subscription',
  Plan: 'Plan',
  Coupon: 'Coupon',
  Invoice: 'Invoice',
  VerificationToken: 'VerificationToken',
  PasswordReset: 'PasswordReset',
  WhatsAppNumber: 'WhatsAppNumber',
  Conversation: 'Conversation',
  Message: 'Message',
  Contact: 'Contact',
  Tag: 'Tag',
  ContactTag: 'ContactTag',
  CustomField: 'CustomField',
  ContactCustomFieldValue: 'ContactCustomFieldValue',
  ConversationNote: 'ConversationNote',
  ContactNote: 'ContactNote',
  AIConfig: 'AIConfig',
  FeatureFlag: 'FeatureFlag',
  Automation: 'Automation',
  AutomationRun: 'AutomationRun',
  Campaign: 'Campaign',
  CampaignRecipient: 'CampaignRecipient',
  Template: 'Template',
  Page: 'Page',
  ApiKey: 'ApiKey',
  WebhookEndpoint: 'WebhookEndpoint',
  WebhookEvent: 'WebhookEvent',
  WebhookDelivery: 'WebhookDelivery',
  AnalyticsEvent: 'AnalyticsEvent',
  DailyMetric: 'DailyMetric',
  AIUsageLog: 'AIUsageLog',
  AIMemory: 'AIMemory',
  Notification: 'Notification',
  NotificationPreference: 'NotificationPreference',
  OnboardingStep: 'OnboardingStep',
  Deal: 'Deal'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
