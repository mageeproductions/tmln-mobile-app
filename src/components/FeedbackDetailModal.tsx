import { useState, useEffect } from 'react';
import { X, ThumbsUp, MessageCircle, Send, User, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';

interface FeedbackPost {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_anonymous: boolean;
  upvote_count: number;
  reply_count: number;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface FeedbackReply {
  id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface FeedbackDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onUpvoteChange: () => void;
}

export default function FeedbackDetailModal({
  isOpen,
  onClose,
  postId,
  onUpvoteChange,
}: FeedbackDetailModalProps) {
  const { user } = useAuth();
  const [post, setPost] = useState<FeedbackPost | null>(null);
  const [replies, setReplies] = useState<FeedbackReply[]>([]);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isAnonymousReply, setIsAnonymousReply] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && postId) {
      fetchPostDetails();
      checkUpvoteStatus();
    }
  }, [isOpen, postId]);

  const fetchPostDetails = async () => {
    setLoading(true);

    const [postResult, repliesResult] = await Promise.all([
      supabase
        .from('feedback_posts')
        .select('*, profiles(first_name, last_name)')
        .eq('id', postId)
        .single(),
      supabase
        .from('feedback_replies')
        .select('*, profiles(first_name, last_name)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }),
    ]);

    if (postResult.data) setPost(postResult.data as any);
    if (repliesResult.data) setReplies(repliesResult.data as any);

    setLoading(false);
  };

  const checkUpvoteStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('feedback_upvotes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    setHasUpvoted(!!data);
  };

  const handleUpvote = async () => {
    if (!user || !post) return;

    if (hasUpvoted) {
      await supabase
        .from('feedback_upvotes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      setHasUpvoted(false);
      setPost({ ...post, upvote_count: post.upvote_count - 1 });
    } else {
      await supabase.from('feedback_upvotes').insert({
        post_id: postId,
        user_id: user.id,
      });
      setHasUpvoted(true);
      setPost({ ...post, upvote_count: post.upvote_count + 1 });
    }

    onUpvoteChange();
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyContent.trim()) return;

    setSubmittingReply(true);

    try {
      const { error } = await supabase.from('feedback_replies').insert({
        post_id: postId,
        user_id: user.id,
        content: replyContent.trim(),
        is_anonymous: isAnonymousReply,
      });

      if (error) throw error;

      setReplyContent('');
      setIsAnonymousReply(false);
      await fetchPostDetails();
      onUpvoteChange();
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Feedback</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : post ? (
        <div className="space-y-6">
          <div>
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">
                    {post.is_anonymous
                      ? 'Anonymous'
                      : `${post.profiles.first_name} ${post.profiles.last_name}`}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm text-gray-400">{formatDate(post.created_at)}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{post.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-gray-700">
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
                  hasUpvoted
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{post.upvote_count}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-400">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{post.reply_count} replies</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h4 className="font-semibold text-white mb-4">Replies</h4>

            {replies.length > 0 ? (
              <div className="space-y-4 mb-6">
                {replies.map((reply) => (
                  <div key={reply.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">
                          {reply.is_anonymous
                            ? 'Anonymous'
                            : `${reply.profiles.first_name} ${reply.profiles.last_name}`}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-6">No replies yet. Be the first to reply!</p>
            )}

            <form onSubmit={handleSubmitReply} className="space-y-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                disabled={submittingReply}
                className="w-full px-4 py-2 bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:opacity-50 resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymousReply"
                    checked={isAnonymousReply}
                    onChange={(e) => setIsAnonymousReply(e.target.checked)}
                    disabled={submittingReply}
                    className="w-4 h-4 text-purple-600 border-gray-500 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="anonymousReply" className="text-sm text-gray-300">
                    Reply anonymously
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={submittingReply || !replyContent.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
                >
                  {submittingReply ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Reply
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-400 py-12">Post not found</p>
      )}
    </Modal>
  );
}
