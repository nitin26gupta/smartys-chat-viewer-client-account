-- Check if switch_on column exists and rename it to agent_on if needed
DO $$
BEGIN
    -- Check if switch_on column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_info' 
        AND column_name = 'switch_on'
    ) THEN
        -- If switch_on exists, rename it to agent_on
        ALTER TABLE public.user_info RENAME COLUMN switch_on TO agent_on;
    END IF;
    
    -- Ensure agent_on column exists with default true
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_info' 
        AND column_name = 'agent_on'
    ) THEN
        ALTER TABLE public.user_info ADD COLUMN agent_on boolean DEFAULT true;
    END IF;
END
$$;