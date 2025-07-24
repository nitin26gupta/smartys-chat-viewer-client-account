-- Delete Johannes Kofler and all related data
DO $$
DECLARE
    target_user_id varchar;
    session_ids_to_delete varchar[];
BEGIN
    -- Find the user_id for the phone number
    SELECT user_id INTO target_user_id 
    FROM user_info 
    WHERE phone_number = '1732744996';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User with phone number 1732744996 not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user_id: %', target_user_id;
    
    -- Get all session IDs for this user
    SELECT ARRAY(SELECT session_id FROM session_user_mapping WHERE user_id = target_user_id) 
    INTO session_ids_to_delete;
    
    RAISE NOTICE 'Sessions to delete: %', session_ids_to_delete;
    
    -- Delete chat histories for these sessions
    DELETE FROM smartys_chat_histories 
    WHERE session_id = ANY(session_ids_to_delete);
    
    RAISE NOTICE 'Deleted chat histories for sessions';
    
    -- Delete session mappings for this user
    DELETE FROM session_user_mapping 
    WHERE user_id = target_user_id;
    
    RAISE NOTICE 'Deleted session mappings for user';
    
    -- Delete user info
    DELETE FROM user_info 
    WHERE user_id = target_user_id;
    
    RAISE NOTICE 'Deleted user info for user_id: %', target_user_id;
    
END $$;