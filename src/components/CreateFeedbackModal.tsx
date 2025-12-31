import { useState } from 'react';
import { X, Upload, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';

interface CreateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateFeedbackModal({ isOpen, onClose, onSuccess }: CreateFeedbackModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 5 - images.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length > 0) {
      setImages([...images, ...filesToAdd]);

      filesToAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim()) return;

    setUploading(true);

    try {
      const { data: post, error: postError } = await supabase
        .from('feedback_posts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          is_anonymous: isAnonymous,
        })
        .select()
        .single();

      if (postError) throw postError;

      if (images.length > 0 && post) {
        const uploadedUrls: { post_id: string; image_url: string; order_index: number }[] = [];

        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${post.id}/${Math.random()}.${fileExt}`;
          const filePath = `feedback/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('event-media')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('event-media')
            .getPublicUrl(filePath);

          uploadedUrls.push({
            post_id: post.id,
            image_url: urlData.publicUrl,
            order_index: i,
          });
        }

        if (uploadedUrls.length > 0) {
          const { error: imagesError } = await supabase
            .from('feedback_images')
            .insert(uploadedUrls);

          if (imagesError) {
            console.error('Error saving image references:', imagesError);
          }
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleClose();
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error creating feedback:', error);
      alert('Failed to submit feedback. Please try again.');
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setTitle('');
      setDescription('');
      setIsAnonymous(false);
      setImages([]);
      setImagePreviews([]);
      setUploading(false);
      onClose();
    }
  };

  if (showSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={() => {}}>
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
          <p className="text-gray-300">
            Your feedback helps make TMLN a better place for everyone.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white">Submit Feedback</h2>
        <button
          onClick={handleClose}
          disabled={uploading}
          className="text-gray-400 hover:text-white transition disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-base font-semibold text-white mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            disabled={uploading}
            className="w-full px-4 py-3 text-base bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Brief summary of your feedback"
          />
        </div>

        <div>
          <label className="block text-base font-semibold text-white mb-2">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            required
            disabled={uploading}
            className="w-full px-4 py-3 text-base bg-gray-900/70 border border-gray-500/60 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            placeholder="Provide detailed information about your feedback, feature request, or bug report..."
          />
        </div>

        <div>
          <label className="block text-base font-semibold text-white mb-3">
            Screenshots <span className="text-gray-400 font-normal">(Optional, max 5)</span>
          </label>

          <div className="mb-3 p-3 bg-gray-900/50 border border-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400 leading-relaxed">
              Images will not be posted publicly. Only TMLN can see the images for troubleshooting purposes.
            </p>
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={uploading}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition disabled:opacity-50 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 5 && (
            <label className="flex items-center justify-center w-full py-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 hover:bg-gray-700/30 transition cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={uploading}
                className="hidden"
              />
              <div className="text-center">
                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-base font-medium text-gray-300">Click to upload images</p>
                <p className="text-sm text-gray-400 mt-1">{images.length} of 5 uploaded</p>
              </div>
            </label>
          )}
        </div>

        <div className="flex items-center gap-3 py-3 bg-gray-900/50 rounded-lg px-4 border border-gray-700/50">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            disabled={uploading}
            className="w-5 h-5 text-purple-600 border-gray-500 rounded focus:ring-purple-500 disabled:opacity-50"
          />
          <label htmlFor="anonymous" className="text-base text-white cursor-pointer select-none">
            Post anonymously <span className="text-gray-400">(your name won't be shown)</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="flex-1 px-6 py-3 text-base font-semibold border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !title.trim() || !description.trim()}
            className="flex-1 px-6 py-3 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
