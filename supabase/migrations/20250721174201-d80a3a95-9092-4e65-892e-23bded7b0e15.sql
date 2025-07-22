-- Enable real-time updates for smartys_chat_histories table
ALTER TABLE smartys_chat_histories REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE smartys_chat_histories;