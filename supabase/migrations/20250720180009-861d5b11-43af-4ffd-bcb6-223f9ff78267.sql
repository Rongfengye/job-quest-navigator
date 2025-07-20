-- Add topic tracking columns to storyline_behaviorals table
ALTER TABLE public.storyline_behaviorals 
ADD COLUMN extracted_topics JSONB DEFAULT '[]'::jsonb,
ADD COLUMN asked_topics JSONB DEFAULT '[]'::jsonb,
ADD COLUMN topic_follow_up_counts JSONB DEFAULT '{}'::jsonb,
ADD COLUMN analytics_history JSONB DEFAULT '[]'::jsonb;