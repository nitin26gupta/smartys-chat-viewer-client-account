-- Fix the function to handle the correct data types
DROP FUNCTION IF EXISTS get_conversation_summaries();

CREATE OR REPLACE FUNCTION get_conversation_summaries()
RETURNS TABLE (
  user_id VARCHAR,
  user_name VARCHAR,
  phone_number VARCHAR,
  agent_on BOOLEAN,
  message_count BIGINT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  session_ids VARCHAR[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  message_counts AS (
    SELECT 
      us.user_id,
      COUNT(DISTINCT ch.id) as msg_count
    FROM user_sessions us
    LEFT JOIN smartys_chat_histories ch ON ch.session_id = ANY(us.session_ids)
    GROUP BY us.user_id
  ),
  latest_messages AS (
    SELECT DISTINCT ON (us.user_id)
      us.user_id,
      ch.message,
      ch.timestamp
    FROM user_sessions us
    LEFT JOIN smartys_chat_histories ch ON ch.session_id = ANY(us.session_ids)
    ORDER BY us.user_id, ch.timestamp DESC NULLS LAST
  )
  SELECT 
    ui.user_id,
    ui.user_name,
    ui.phone_number,
    ui.agent_on,
    COALESCE(mc.msg_count, 0) as message_count,
    COALESCE(
      CASE 
        WHEN (lm.message->>'type') = 'image' THEN '📷 Image'
        ELSE (lm.message->>'content')
      END,
      'No messages'
    ) as last_message,
    COALESCE(lm.timestamp, ui.created_at) as last_message_time,
    COALESCE(us.session_ids, ARRAY[]::VARCHAR[]) as session_ids
  FROM user_info ui
  LEFT JOIN user_sessions us ON us.user_id = ui.user_id
  LEFT JOIN message_counts mc ON mc.user_id = ui.user_id
  LEFT JOIN latest_messages lm ON lm.user_id = ui.user_id
  WHERE us.session_ids IS NOT NULL
  ORDER BY last_message_time DESC;
END;
$$;