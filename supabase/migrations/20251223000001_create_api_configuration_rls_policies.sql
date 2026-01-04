-- Enable RLS on api_configuration table
ALTER TABLE public.api_configuration ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view API configurations for their own client
CREATE POLICY "Users can view API configurations for their client"
    ON public.api_configuration
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = auth.uid()
            AND employees.client_id = api_configuration.client_id
        )
    );

-- Policy: Users can insert API configurations for their own client
CREATE POLICY "Users can create API configurations for their client"
    ON public.api_configuration
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = auth.uid()
            AND employees.client_id = api_configuration.client_id
        )
    );

-- Policy: Users can update API configurations for their own client
CREATE POLICY "Users can update API configurations for their client"
    ON public.api_configuration
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = auth.uid()
            AND employees.client_id = api_configuration.client_id
        )
    );

-- Policy: Users can delete API configurations for their own client
CREATE POLICY "Users can delete API configurations for their client"
    ON public.api_configuration
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.id = auth.uid()
            AND employees.client_id = api_configuration.client_id
        )
    );




