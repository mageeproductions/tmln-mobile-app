/*
  # Feedback System Schema

  1. New Tables
    - `feedback_posts`: Stores user feedback posts
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text, required)
      - `description` (text, required)
      - `is_anonymous` (boolean, default false)
      - `upvote_count` (integer, default 0)
      - `reply_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `feedback_images`: Stores screenshots for feedback posts
      - `id` (uuid, primary key)
      - `post_id` (uuid, references feedback_posts)
      - `image_url` (text, required)
      - `order_index` (integer, for ordering images)
      - `created_at` (timestamp)

    - `feedback_upvotes`: Tracks user upvotes on posts
      - `id` (uuid, primary key)
      - `post_id` (uuid, references feedback_posts)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamp)
      - Unique constraint on (post_id, user_id)

    - `feedback_replies`: Stores replies to feedback posts
      - `id` (uuid, primary key)
      - `post_id` (uuid, references feedback_posts)
      - `user_id` (uuid, references profiles)
      - `content` (text, required)
      - `is_anonymous` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can view all feedback posts and replies
    - Users can create their own posts and replies
    - Users can upvote posts
    - Users can only edit/delete their own posts and replies

  3. Functions
    - Trigger to update upvote_count when upvotes are added/removed
    - Trigger to update reply_count when replies are added/removed
*/

-- Create feedback_posts table
CREATE TABLE IF NOT EXISTS feedback_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  is_anonymous boolean DEFAULT false,
  upvote_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE feedback_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedback posts"
  ON feedback_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create feedback posts"
  ON feedback_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON feedback_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON feedback_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create feedback_images table
CREATE TABLE IF NOT EXISTS feedback_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES feedback_posts(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedback images"
  ON feedback_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add images to their posts"
  ON feedback_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM feedback_posts
      WHERE feedback_posts.id = post_id
      AND feedback_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their post images"
  ON feedback_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM feedback_posts
      WHERE feedback_posts.id = post_id
      AND feedback_posts.user_id = auth.uid()
    )
  );

-- Create feedback_upvotes table
CREATE TABLE IF NOT EXISTS feedback_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES feedback_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE feedback_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes"
  ON feedback_upvotes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upvote posts"
  ON feedback_upvotes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their upvotes"
  ON feedback_upvotes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create feedback_replies table
CREATE TABLE IF NOT EXISTS feedback_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES feedback_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view replies"
  ON feedback_replies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create replies"
  ON feedback_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies"
  ON feedback_replies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
  ON feedback_replies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update upvote count
CREATE OR REPLACE FUNCTION update_feedback_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback_posts
    SET upvote_count = upvote_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_posts
    SET upvote_count = upvote_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_upvote_count_trigger
AFTER INSERT OR DELETE ON feedback_upvotes
FOR EACH ROW
EXECUTE FUNCTION update_feedback_upvote_count();

-- Function to update reply count
CREATE OR REPLACE FUNCTION update_feedback_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback_posts
    SET reply_count = reply_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback_posts
    SET reply_count = reply_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_reply_count_trigger
AFTER INSERT OR DELETE ON feedback_replies
FOR EACH ROW
EXECUTE FUNCTION update_feedback_reply_count();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_posts_created_at ON feedback_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_posts_upvote_count ON feedback_posts(upvote_count DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_upvotes_post_id ON feedback_upvotes(post_id);
CREATE INDEX IF NOT EXISTS idx_feedback_replies_post_id ON feedback_replies(post_id);
