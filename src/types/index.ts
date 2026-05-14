export type UserRole = 'consumer' | 'organization';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  organizationName?: string;
  contactEmail?: string;
  phoneNumber?: string;
  description?: string;
  createdAt: string;
}

export interface Tender {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  organizationName: string;
  category: string;
  budget: string;
  deadline: string;
  status: 'open' | 'closed' | 'under-review' | 'awarded';
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  tenderId: string;
  tenderTitle: string;
  organizationName: string;
  userId: string;
  userName: string;
  proposal: string;
  amount: number;
  status: 'submitted' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'bid_submitted' | 'status_changed' | 'message_received';
  relatedId: string; // e.g., bidId or tenderId
  read: boolean;
  createdAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  createdAt: any;
}
