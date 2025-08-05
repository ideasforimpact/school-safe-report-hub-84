import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create admin client with service role to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { action, data } = await req.json()

    console.log(`Backoffice client management action: ${action}`)

    switch (action) {
      case 'fetch-clients': {
        const { data: clients, error } = await supabaseAdmin
          .from('clients')
          .select(`
            *,
            client_type (
              id,
              name,
              key
            )
          `)
          .order('creation_date', { ascending: false })

        if (error) {
          console.error('Error fetching clients:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch clients' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ clients }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'add-client': {
        const { client } = data

        // Insert client
        const { data: newClient, error: clientError } = await supabaseAdmin
          .from('clients')
          .insert([client])
          .select()
          .single()

        if (clientError) {
          console.error('Error creating client:', clientError)
          return new Response(
            JSON.stringify({ error: 'Failed to create client' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Handle module access if provided
        if (client.moduleAccess && client.moduleAccess.length > 0) {
          const moduleAccessData = client.moduleAccess.map((moduleId: string) => ({
            client_id: newClient.id,
            module_id: moduleId,
            enabled: true,
            access_level: {}
          }))

          const { error: moduleError } = await supabaseAdmin
            .from('client_modules')
            .insert(moduleAccessData)

          if (moduleError) {
            console.error('Error creating client modules:', moduleError)
            // Don't fail the entire operation, just log the error
          }
        }

        return new Response(
          JSON.stringify({ client: newClient }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update-client': {
        const { id, updates } = data

        // Update client
        const { data: updatedClient, error: clientError } = await supabaseAdmin
          .from('clients')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (clientError) {
          console.error('Error updating client:', clientError)
          return new Response(
            JSON.stringify({ error: 'Failed to update client' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Handle module access updates if provided
        if (updates.moduleAccess !== undefined) {
          // Delete existing module access
          await supabaseAdmin
            .from('client_modules')
            .delete()
            .eq('client_id', id)

          // Insert new module access
          if (updates.moduleAccess.length > 0) {
            const moduleAccessData = updates.moduleAccess.map((moduleId: string) => ({
              client_id: id,
              module_id: moduleId,
              enabled: true,
              access_level: {}
            }))

            const { error: moduleError } = await supabaseAdmin
              .from('client_modules')
              .insert(moduleAccessData)

            if (moduleError) {
              console.error('Error updating client modules:', moduleError)
              // Don't fail the entire operation, just log the error
            }
          }
        }

        return new Response(
          JSON.stringify({ client: updatedClient }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete-client': {
        const { id } = data

        // Delete client (cascading deletes will handle related records)
        const { error } = await supabaseAdmin
          .from('clients')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Error deleting client:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to delete client' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Backoffice client management error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})