import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceRoleKey()
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid authentication')
    }

    // Get employee info from the user
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, client_id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (employeeError || !employee) {
      throw new Error('Employee not found')
    }

    if (!employee.status) {
      throw new Error('Employee account is inactive')
    }

    const body = await req.json() as any
    const action = body?.action || 'create_bulk'

    if (action === 'create_bulk') {
      const vehicles = body?.vehicles as Array<{
        vehicle_name: string
        type: string
        vehicle_no: string
        name: string
        validity_from: string
        validity_to: string
        comments?: string | null
      }>

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      throw new Error('Vehicles array is required and must not be empty')
    }

    // Validate each vehicle
    for (const vehicle of vehicles) {
      if (!vehicle.vehicle_name?.trim()) {
        throw new Error('Vehicle name is required for all vehicles')
      }
      if (!vehicle.type?.trim()) {
        throw new Error('Vehicle type is required for all vehicles')
      }
      if (!vehicle.vehicle_no?.trim()) {
        throw new Error('Vehicle number is required for all vehicles')
      }
      if (!vehicle.name?.trim()) {
        throw new Error('Name is required for all vehicles')
      }
      if (!vehicle.validity_from) {
        throw new Error('Validity from date is required for all vehicles')
      }
      if (!vehicle.validity_to) {
        throw new Error('Validity to date is required for all vehicles')
      }
    }

    // Prepare vehicles data for insertion
    const vehiclesToInsert = vehicles.map((vehicle) => ({
      vehicle_name: vehicle.vehicle_name.trim(),
      type: vehicle.type.trim(),
      vehicle_no: vehicle.vehicle_no.trim(),
      client_id: employee.client_id,
      employee_id: employee.id,
      name: vehicle.name.trim(),
      validity_from: vehicle.validity_from,
      validity_to: vehicle.validity_to,
      comments: vehicle.comments?.trim() || null,
    }))

    console.log('Creating trusted vehicles:', { 
      count: vehiclesToInsert.length, 
      client_id: employee.client_id,
      employee_id: employee.id 
    })

    const { data, error } = await supabase
      .from('trusted_vehicle')
      .insert(vehiclesToInsert)
      .select()

    if (error) {
      console.error('Error inserting trusted vehicles:', error)
      throw new Error(error.message || 'Failed to create trusted vehicles')
    }

    console.log('Successfully created trusted vehicles:', data.length)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${data.length} trusted vehicle(s)`,
        data,
        count: data.length
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    }

    if (action === 'update') {
      const vehicle = body?.vehicle as {
        id: string
        vehicle_name: string
        type: string
        vehicle_no: string
        name: string
        validity_from: string | null
        validity_to: string | null
        comments?: string | null
      }

      if (!vehicle?.id) {
        throw new Error('Vehicle id is required for update')
      }

      if (!vehicle.vehicle_name?.trim()) {
        throw new Error('Vehicle name is required')
      }
      if (!vehicle.type?.trim()) {
        throw new Error('Vehicle type is required')
      }
      if (!vehicle.vehicle_no?.trim()) {
        throw new Error('Vehicle number is required')
      }
      if (!vehicle.name?.trim()) {
        throw new Error('Name is required')
      }

      const updatePayload: Record<string, any> = {
        vehicle_name: vehicle.vehicle_name.trim(),
        type: vehicle.type.trim(),
        vehicle_no: vehicle.vehicle_no.trim(),
        name: vehicle.name.trim(),
        comments: vehicle.comments?.trim() || null,
      }

      if (vehicle.validity_from) {
        updatePayload.validity_from = vehicle.validity_from
      }
      if (vehicle.validity_to) {
        updatePayload.validity_to = vehicle.validity_to
      }

      console.log('Updating trusted vehicle:', { id: vehicle.id, client_id: employee.client_id })

      const { data, error } = await supabase
        .from('trusted_vehicle')
        .update(updatePayload)
        .eq('id', vehicle.id)
        .eq('client_id', employee.client_id)
        .select()
        .maybeSingle()

      if (error) {
        console.error('Error updating trusted vehicle:', error)
        throw new Error(error.message || 'Failed to update trusted vehicle')
      }

      if (!data) {
        throw new Error('Trusted vehicle not found or not owned by this client')
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Trusted vehicle updated successfully',
          data,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    if (action === 'delete') {
      const vehicleId = body?.vehicle_id as string | undefined

      if (!vehicleId) {
        throw new Error('vehicle_id is required for delete')
      }

      console.log('Deleting trusted vehicle:', { id: vehicleId, client_id: employee.client_id })

      const { data, error } = await supabase
        .from('trusted_vehicle')
        .delete()
        .eq('id', vehicleId)
        .eq('client_id', employee.client_id)
        .select()
        .maybeSingle()

      if (error) {
        console.error('Error deleting trusted vehicle:', error)
        throw new Error(error.message || 'Failed to delete trusted vehicle')
      }

      if (!data) {
        throw new Error('Trusted vehicle not found or not owned by this client')
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Trusted vehicle deleted successfully',
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    throw new Error(`Unsupported action: ${action}`)

  } catch (error) {
    console.error('Unexpected error creating trusted vehicles:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: (error as any).message || 'An unexpected error occurred while managing trusted vehicles'
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

