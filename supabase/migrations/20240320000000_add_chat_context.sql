-- Add chat context columns to sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS system_context TEXT,
ADD COLUMN IF NOT EXISTS menu_items JSONB,
ADD COLUMN IF NOT EXISTS time_of_day TEXT;

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'set_updated_at'
    ) THEN
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.sessions
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$; 