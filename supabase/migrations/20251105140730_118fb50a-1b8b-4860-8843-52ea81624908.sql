-- Add missing session_id mappings for existing chat histories
-- This fixes the issue where messages exist but aren't showing up because session_user_mapping is incomplete

INSERT INTO session_user_mapping (user_id, session_id)
SELECT DISTINCT
  ui.user_id::varchar,
  ch.session_id
FROM smartys_chat_histories ch
JOIN user_info ui ON (
  ch.session_id = '+' || ui.phone_number 
  OR ch.session_id LIKE '%' || ui.phone_number || '%'
)
WHERE NOT EXISTS (
  SELECT 1 FROM session_user_mapping sum
  WHERE sum.session_id = ch.session_id
)
ON CONFLICT (session_id) DO NOTHING;

-- Create a trigger function to automatically create session_user_mapping entries
-- when new messages are inserted into smartys_chat_histories
CREATE OR REPLACE FUNCTION auto_create_session_mapping()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to find matching user_info based on session_id containing phone number
  INSERT INTO session_user_mapping (user_id, session_id)
  SELECT DISTINCT ui.user_id::varchar, NEW.session_id
  FROM user_info ui
  WHERE NEW.session_id = '+' || ui.phone_number 
     OR NEW.session_id LIKE '%' || ui.phone_number || '%'
  ON CONFLICT (session_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically map sessions when new messages arrive
DROP TRIGGER IF EXISTS auto_session_mapping_trigger ON smartys_chat_histories;
CREATE TRIGGER auto_session_mapping_trigger
  AFTER INSERT ON smartys_chat_histories
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_session_mapping();