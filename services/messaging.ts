import { supabase } from '@/lib/supabaseClient'

export interface Message {
  id: string
  booking_id: string
  sender_id: string
  recipient_id: string
  message: string
  is_read: boolean
  read_at?: string
  created_at: string
  sender?: {
    name: string
    id: string
  }
  recipient?: {
    name: string
    id: string
  }
}

export interface CreateMessageData {
  booking_id: string
  recipient_id: string
  message: string
}

/* =========================
   SEND MESSAGE
========================= */

export const sendMessage = async (data: CreateMessageData): Promise<Message> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to send messages')
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert([
      {
        booking_id: data.booking_id,
        sender_id: user.id,
        recipient_id: data.recipient_id,
        message: data.message,
      },
    ])
    .select(`
      *,
      sender:sender_id(id, name),
      recipient:recipient_id(id, name)
    `)
    .single()

  if (error) {
    console.error('Error sending message:', error)
    throw new Error('Failed to send message')
  }

  return message
}

/* =========================
   GET MESSAGES
========================= */

export const getBookingMessages = async (bookingId: string): Promise<Message[]> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to view messages')
  }

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id(id, name),
      recipient:recipient_id(id, name)
    `)
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    throw new Error('Failed to fetch messages')
  }

  // Verify user has access to this booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', bookingId)
    .in('customer_id, provider_id', [user.id, user.id])
    .single()

  if (!booking) {
    throw new Error('You do not have permission to view these messages')
  }

  return data || []
}

export const getConversations = async (): Promise<Array<{
  booking_id: string
  other_user_id: string
  other_user_name: string
  last_message: string
  last_message_time: string
  unread_count: number
}>> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  // Get all unique conversations for the current user
  const { data, error } = await supabase
    .from('messages')
    .select('booking_id, sender_id, recipient_id, message, created_at, is_read')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    throw new Error('Failed to fetch conversations')
  }

  const conversationMap = new Map<string, {
    booking_id: string
    other_user_id: string
    last_message: string
    last_message_time: string
    unread_count: number
  }>()

  for (const msg of data || []) {
    const other_user_id = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
    const key = `${msg.booking_id}-${other_user_id}`

    if (!conversationMap.has(key)) {
      conversationMap.set(key, {
        booking_id: msg.booking_id,
        other_user_id,
        last_message: msg.message,
        last_message_time: msg.created_at,
        unread_count: 0,
      })
    }

    // Count unread messages
    if (msg.recipient_id === user.id && !msg.is_read) {
      const conv = conversationMap.get(key)!
      conv.unread_count++
    }
  }

  // Get user names
  const userIds = Array.from(conversationMap.values()).map(c => c.other_user_id)
  
  if (userIds.length === 0) {
    return []
  }

  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .in('id', userIds)

  const userMap = new Map(users?.map(u => [u.id, u.name]) || [])

  return Array.from(conversationMap.values()).map(conv => ({
    ...conv,
    other_user_name: userMap.get(conv.other_user_id) || 'Unknown',
  }))
}

export const getUnreadMessagesCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return 0
  }

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error counting unread messages:', error)
    return 0
  }

  return count || 0
}

/* =========================
   MARK AS READ
========================= */

export const markMessageAsRead = async (messageId: string): Promise<Message> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { data, error } = await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('recipient_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error marking message as read:', error)
    throw new Error('Failed to mark message as read')
  }

  return data
}

export const markBookingMessagesAsRead = async (bookingId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { error } = await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('booking_id', bookingId)
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking messages as read:', error)
    throw new Error('Failed to mark messages as read')
  }
}

/* =========================
   DELETE MESSAGE
========================= */

export const deleteMessage = async (messageId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id)

  if (error) {
    console.error('Error deleting message:', error)
    throw new Error('Failed to delete message')
  }
}

/* =========================
   SEARCH MESSAGES
========================= */

export const searchMessages = async (
  bookingId: string,
  query: string
): Promise<Message[]> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  // Use ilike for case-insensitive search
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id(id, name),
      recipient:recipient_id(id, name)
    `)
    .eq('booking_id', bookingId)
    .ilike('message', `%${query}%`)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error searching messages:', error)
    throw new Error('Failed to search messages')
  }

  return data || []
}

/* =========================
   GET MESSAGE STATS
========================= */

export const getMessageStats = async (bookingId: string): Promise<{
  total_messages: number
  unread_count: number
}> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { count: total_messages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('booking_id', bookingId)

  const { count: unread_count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('booking_id', bookingId)
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  return {
    total_messages: total_messages || 0,
    unread_count: unread_count || 0,
  }
}
