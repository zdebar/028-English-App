-- Add foreign key to auth.users.id in user_items
ALTER TABLE user_items
ADD CONSTRAINT user_items_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key to auth.users.id in user_score
ALTER TABLE user_score
ADD CONSTRAINT user_score_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;