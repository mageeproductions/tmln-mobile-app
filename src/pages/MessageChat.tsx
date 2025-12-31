import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, Send, Paperclip, X, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ensureStorageBucket } from '../lib/storageSetup';

interface Attachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  attachment_type: 'image' | 'file';
  created_at: string;
}

interface Message {
  id: string;
  event_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  message_attachments?: Attachment[];
}

interface Event {
  id: string;
  event_name: string;
}

export default function MessageChat() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (eventId && user) {
      ensureStorageBucket();
      fetchEventAndMessages();
      subscribeToMessages();
    }
  }, [eventId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async () => {
    if (!eventId || !user) return;

    const { data: unreadMessages } = await supabase
      .from('event_messages')
      .select('id')
      .eq('event_id', eventId)
      .neq('user_id', user.id);

    if (!unreadMessages || unreadMessages.length === 0) return;

    for (const message of unreadMessages) {
      const { data: existingReceipt } = await supabase
        .from('message_read_receipts')
        .select('id')
        .eq('message_id', message.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingReceipt) {
        await supabase
          .from('message_read_receipts')
          .insert({
            message_id: message.id,
            user_id: user.id,
          });
      }
    }
  };

  const fetchEventAndMessages = async () => {
    if (!eventId) return;

    setLoading(true);

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, event_name')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      setLoading(false);
      return;
    }

    setEvent(eventData);

    const { data: messagesData, error: messagesError } = await supabase
      .from('event_messages')
      .select('*, profiles(first_name, last_name), message_attachments(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    } else {
      setMessages(messagesData || []);
      markMessagesAsRead();
    }

    setLoading(false);
  };

  const subscribeToMessages = () => {
    if (!eventId) return;

    const channel = supabase
      .channel(`event_messages_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const { data: newMessageData } = await supabase
            .from('event_messages')
            .select('*, profiles(first_name, last_name), message_attachments(*)')
            .eq('id', payload.new.id)
            .maybeSingle();

          if (newMessageData) {
            setMessages((prev) => {
              const exists = prev.some(m => m.id === newMessageData.id);
              if (exists) return prev;
              return [...prev, newMessageData];
            });

            if (newMessageData.user_id !== user?.id) {
              await supabase
                .from('message_read_receipts')
                .insert({
                  message_id: newMessageData.id,
                  user_id: user?.id,
                });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, messageId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${messageId}/${Date.now()}.${fileExt}`;
    const filePath = `message-attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-files')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('event-files')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!newMessage.trim() && selectedFiles.length === 0) || !eventId || !user || sending) return;

    setSending(true);
    setUploading(true);
    const messageText = newMessage.trim() || '';
    setNewMessage('');

    const { data: insertedMessage, error } = await supabase
      .from('event_messages')
      .insert({
        event_id: eventId,
        user_id: user.id,
        message: messageText,
      })
      .select('*, profiles(first_name, last_name)')
      .single();

    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
      setSending(false);
      setUploading(false);
      return;
    }

    if (insertedMessage && selectedFiles.length > 0) {
      const attachmentPromises = selectedFiles.map(async (file) => {
        const fileUrl = await uploadFile(file, insertedMessage.id);

        if (fileUrl) {
          const attachmentType = file.type.startsWith('image/') ? 'image' : 'file';

          return supabase.from('message_attachments').insert({
            message_id: insertedMessage.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: fileUrl,
            attachment_type: attachmentType,
          });
        }
        return null;
      });

      await Promise.all(attachmentPromises);

      const { data: messageWithAttachments } = await supabase
        .from('event_messages')
        .select('*, profiles(first_name, last_name), message_attachments(*)')
        .eq('id', insertedMessage.id)
        .single();

      if (messageWithAttachments) {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === messageWithAttachments.id);
          if (exists) return prev;
          return [...prev, messageWithAttachments];
        });
      }
    } else if (insertedMessage) {
      setMessages((prev) => {
        const exists = prev.some(m => m.id === insertedMessage.id);
        if (exists) return prev;
        return [...prev, { ...insertedMessage, message_attachments: [] }];
      });
    }

    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSending(false);
    setUploading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(attachment.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isMyMessage = (message: Message) => {
    return message.user_id === user?.id;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/dashboard/messages')}
              className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {event?.event_name || 'Loading...'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">Event Chat</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-4 lg:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600 mb-2">No messages yet</p>
                <p className="text-sm text-gray-500">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-md ${
                      isMyMessage(message)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    } rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm`}
                  >
                    {!isMyMessage(message) && (
                      <p className="text-xs font-semibold mb-1 text-purple-600">
                        {message.profiles.first_name} {message.profiles.last_name}
                      </p>
                    )}
                    {message.message && (
                      <p className="text-sm break-words">{message.message}</p>
                    )}
                    {message.message_attachments && message.message_attachments.length > 0 && (
                      <div className={`${message.message ? 'mt-2' : ''} space-y-2`}>
                        {message.message_attachments.map((attachment) => (
                          <div key={attachment.id}>
                            {attachment.attachment_type === 'image' ? (
                              <div className="relative group">
                                <img
                                  src={attachment.file_url}
                                  alt={attachment.file_name}
                                  className="rounded-lg max-w-full h-auto cursor-pointer"
                                  onClick={() => window.open(attachment.file_url, '_blank')}
                                />
                                <button
                                  onClick={() => handleDownload(attachment)}
                                  className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                                >
                                  <Download className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleDownload(attachment)}
                                className={`flex items-center gap-2 p-2 rounded-lg transition ${
                                  isMyMessage(message)
                                    ? 'bg-purple-700 hover:bg-purple-800'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                                <div className="flex-1 text-left min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {attachment.file_name}
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      isMyMessage(message) ? 'text-purple-200' : 'text-gray-500'
                                    }`}
                                  >
                                    {formatFileSize(attachment.file_size)}
                                  </p>
                                </div>
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        isMyMessage(message) ? 'text-purple-200' : 'text-gray-500'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            {selectedFiles.length > 0 && (
              <div className="mb-2 sm:mb-3 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative bg-gray-100 rounded-lg p-2 pr-8 flex items-center gap-2 max-w-full"
                  >
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm text-gray-700 truncate max-w-[150px] sm:max-w-xs">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 hover:bg-gray-200 rounded transition"
                    >
                      <X className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploading}
                className="p-2 sm:p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending || uploading}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || uploading}
                className="p-2 sm:p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
