import { useState, useEffect } from 'react';
import { ThumbsUp, MessageCircle, Plus, TrendingUp, Clock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import CreateFeedbackModal from '../components/CreateFeedbackModal';
import FeedbackDetailModal from '../components/FeedbackDetailModal';

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

export default function Feedback() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
    fetchUserUpvotes();
  }, [sortBy]);

  const fetchPosts = async () => {
    setLoading(true);

    const query = supabase
      .from('feedback_posts')
      .select('*, profiles(first_name, last_name)');

    if (sortBy === 'recent') {
      query.order('created_at', { ascending: false });
    } else {
      query.order('upvote_count', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data as any);
    }

    setLoading(false);
  };

  const fetchUserUpvotes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('feedback_upvotes')
      .select('post_id')
      .eq('user_id', user.id);

    if (data) {
      setUserUpvotes(new Set(data.map((upvote) => upvote.post_id)));
    }
  };

  const handleUpvote = async (postId: string, currentCount: number) => {
    if (!user) return;

    const hasUpvoted = userUpvotes.has(postId);

    if (hasUpvoted) {
      await supabase
        .from('feedback_upvotes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setUserUpvotes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, upvote_count: Math.max(0, currentCount - 1) }
            : post
        )
      );
    } else {
      await supabase.from('feedback_upvotes').insert({
        post_id: postId,
        user_id: user.id,
      });

      setUserUpvotes((prev) => new Set(prev).add(postId));

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, upvote_count: currentCount + 1 } : post
        )
      );
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

  return (
    <DashboardLayout>
      <div className="min-h-full bg-gray-50">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
              <p className="text-gray-600 mt-1">Share ideas and help us improve TMLN</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Feedback</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setSortBy('recent')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition ${
                  sortBy === 'recent'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                Recent
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition ${
                  sortBy === 'popular'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Popular
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
                  onClick={() => setSelectedPostId(post.id)}
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpvote(post.id, post.upvote_count);
                        }}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg transition ${
                          userUpvotes.has(post.id)
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <ThumbsUp
                          className={`w-5 h-5 ${
                            userUpvotes.has(post.id) ? 'fill-current' : ''
                          }`}
                        />
                      </button>
                      <span className="text-sm font-medium text-gray-700">
                        {post.upvote_count}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {post.is_anonymous
                            ? 'Anonymous'
                            : `${post.profiles.first_name} ${post.profiles.last_name}`}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(post.created_at)}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-2 mb-3">
                        {post.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.reply_count} replies</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedback yet</h3>
              <p className="text-gray-600 mb-4">Be the first to share your ideas!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                Submit Feedback
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateFeedbackModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchPosts();
          fetchUserUpvotes();
        }}
      />

      {selectedPostId && (
        <FeedbackDetailModal
          isOpen={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          postId={selectedPostId}
          onUpvoteChange={() => {
            fetchPosts();
            fetchUserUpvotes();
          }}
        />
      )}
    </DashboardLayout>
  );
}
