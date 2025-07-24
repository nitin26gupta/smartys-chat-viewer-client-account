-- Add timestamp column to smartys_chat_histories table
ALTER TABLE public.smartys_chat_histories 
ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();