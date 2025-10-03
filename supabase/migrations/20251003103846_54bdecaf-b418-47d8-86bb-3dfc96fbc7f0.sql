-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_user_mapping_user_id ON session_user_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_smartys_chat_histories_session_id ON smartys_chat_histories(session_id);
CREATE INDEX IF NOT EXISTS idx_smartys_chat_histories_timestamp ON smartys_chat_histories(timestamp DESC);

-- Create a function to get conversation summaries efficiently
CREATE OR REPLACE FUNCTION get_conversation_summaries()
RETURNS TABLE (
  user_id VARCHAR,
  user_name VARCHAR,
  phone_number VARCHAR,
  agent_on BOOLEAN,
  message_count BIGINT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  session_ids TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_sessions AS (
    SELECT 
      sum.user_id,
      array_agg(DISTINCT sum.session_id) as session_ids
    FROM session_user_mapping sum
    GROUP BY sum.user_id
  ),
  latest_messages AS (
    SELECT DISTINCT ON (us.user_id)
      us.user_id,
      ch.message,
      ch.timestamp,
      COUNT(*) OVER (PARTITION BY us.user_id) as msg_count
    FROM user_sessions us
    CROSS JOIN LATERAL (
      SELECT sch.message, sch.timestamp
      FROM smartys_chat_histories sch
      WHERE sch.session_id = ANY(us.session_ids)
      ORDER BY sch.timestamp DESC
      LIMIT 1
    ) ch
  )
  SELECT 
    ui.user_id,
    ui.user_name,
    ui.phone_number,
    ui.agent_on,
    COALESCE(lm.msg_count, 0) as message_count,
    COALESCE(
      CASE 
        WHEN (lm.message->>'type') = 'image' THEN '📷 Image'
        ELSE (lm.message->>'content')
      END,
      'No messages'
    ) as last_message,
    COALESCE(lm.timestamp, ui.created_at) as last_message_time,
    COALESCE(us.session_ids, ARRAY[]::TEXT[]) as session_ids
  FROM user_info ui
  LEFT JOIN user_sessions us ON us.user_id = ui.user_id
  LEFT JOIN latest_messages lm ON lm.user_id = ui.user_id
  WHERE us.session_ids IS NOT NULL
  ORDER BY last_message_time DESC;
END;
$$;