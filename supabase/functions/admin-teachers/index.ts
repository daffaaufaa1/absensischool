import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const { nit, full_name, subject, password } = await req.json();

      // Check duplicate NIT
      const { data: existing } = await supabase
        .from("teachers")
        .select("id")
        .eq("nit", nit)
        .single();
      if (existing) {
        return new Response(
          JSON.stringify({ error: "NIT sudah terdaftar" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: hashedPw } = await supabase.rpc("hash_password", { password });

      const { data, error } = await supabase
        .from("teachers")
        .insert({ nit, full_name, subject, password_hash: hashedPw })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "PUT") {
      const { id, nit, full_name, subject, password } = await req.json();

      const updates: Record<string, unknown> = { nit, full_name, subject };

      if (password) {
        const { data: hashedPw } = await supabase.rpc("hash_password", { password });
        updates.password_hash = hashedPw;
      }

      const { data, error } = await supabase
        .from("teachers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const { id } = await req.json();
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
