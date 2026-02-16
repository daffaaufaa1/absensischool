import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-school-id, x-action",
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
    let school_id = url.searchParams.get("school_id") || req.headers.get("x-school-id");
    const action = req.headers.get("x-action");

    // Class management actions
    if (action === "add-class") {
      const { name, school_id: bodySchoolId } = await req.json();
      const sid = bodySchoolId || school_id;
      if (!sid || !name) {
        return new Response(
          JSON.stringify({ error: "Nama kelas dan school_id diperlukan" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check duplicate
      const { data: existing } = await supabase
        .from("classes")
        .select("id")
        .eq("name", name)
        .eq("school_id", sid)
        .single();
      if (existing) {
        return new Response(
          JSON.stringify({ error: "Nama kelas sudah ada" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("classes")
        .insert({ name, school_id: sid })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete-class") {
      const { id } = await req.json();
      // Nullify students' class_id
      await supabase.from("students").update({ class_id: null }).eq("class_id", id);
      // Delete journals referencing this class
      await supabase.from("journals").delete().eq("class_id", id);
      // Delete pengurus_kelas_access
      await supabase.from("pengurus_kelas_access").delete().eq("class_id", id);
      // Delete the class
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      let query = supabase
        .from("students")
        .select("*, classes(name)")
        .order("full_name", { ascending: true });

      if (school_id) {
        query = query.eq("school_id", school_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const { nis, full_name, class_id, password, school_id: bodySchoolId } = await req.json();
      const sid = bodySchoolId || school_id;

      if (!sid) {
        return new Response(
          JSON.stringify({ error: "school_id diperlukan" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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

      const { data: existing } = await supabase
        .from("students")
        .select("id")
        .eq("nis", nis)
        .eq("school_id", sid)
        .single();
      if (existing) {
        return new Response(
          JSON.stringify({ error: "NIS sudah terdaftar di sekolah ini" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: hashedPw } = await supabase.rpc("hash_password", { password });

      const { data, error } = await supabase
        .from("students")
        .insert({ nis, full_name, class_id, password_hash: hashedPw, school_id: sid })
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
