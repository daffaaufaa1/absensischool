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

    const url = new URL(req.url);

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("students")
        .select("*, classes(name)")
        .order("full_name", { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const { nis, full_name, class_id, password } = await req.json();

      // Check max 35 students per class
      if (class_id) {
        const { count } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("class_id", class_id);
        if (count && count >= 35) {
          return new Response(
            JSON.stringify({ error: "Maksimal 35 siswa per kelas" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Check duplicate NIS
      const { data: existing } = await supabase
        .from("students")
        .select("id")
        .eq("nis", nis)
        .single();
      if (existing) {
        return new Response(
          JSON.stringify({ error: "NIS sudah terdaftar" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash password
      const { data: hashedPw } = await supabase.rpc("hash_password", { password });

      const { data, error } = await supabase
        .from("students")
        .insert({ nis, full_name, class_id, password_hash: hashedPw })
        .select("*, classes(name)")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "PUT") {
      const { id, nis, full_name, class_id, password } = await req.json();

      const updates: Record<string, unknown> = { nis, full_name, class_id };

      if (password) {
        const { data: hashedPw } = await supabase.rpc("hash_password", { password });
        updates.password_hash = hashedPw;
      }

      const { data, error } = await supabase
        .from("students")
        .update(updates)
        .eq("id", id)
        .select("*, classes(name)")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const { id } = await req.json();
      const { error } = await supabase.from("students").delete().eq("id", id);
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
