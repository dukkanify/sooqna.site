export {
  addMessageToConversation,
  counterpartName,
  fetchConversationById,
  findConversationForListing,
  getChatConversationById,
  getChatConversations,
  getChatThreads,
  getConversationUnreadCount,
  getUnreadChatCount,
  markConversationRead,
  openListingConversation,
  resolveOrCreateConversation,
  syncChatConversationsFromServer,
} from "./chat.service";

export type { ChatConversation, ChatMessage } from "./chat.service";
