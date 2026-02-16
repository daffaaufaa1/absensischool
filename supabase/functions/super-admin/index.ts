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
    const action = url.searchParams.get("action");

    // Super admin login
    if (action === "login") {
      const { username, password } = await req.json();
      const { data: admin, error } = await supabase
        .from("super_admins")
        .select("*")
        .eq("username", username)
        .single();

      if (error || !admin) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: isValid } = await supabase.rpc("verify_password", {
        input_password: password,
        stored_hash: admin.password_hash,
      });

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, super_admin_id: admin.id, username: admin.username }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List schools
    if (action === "list-schools") {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("name");

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // School detail
    if (action === "school-detail") {
      const schoolId = url.searchParams.get("school_id");
      if (!schoolId) throw new Error("school_id required");

      const [schoolRes, adminRes, studentRes, teacherRes, classRes] = await Promise.all([
        supabase.from("schools").select("*").eq("id", schoolId).single(),
        supabase.from("admin_users").select("username").eq("school_id", schoolId).single(),
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
        supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
      ]);

      return new Response(JSON.stringify({
        school: schoolRes.data,
        admin_username: adminRes.data?.username || '-',
        student_count: studentRes.count || 0,
        teacher_count: teacherRes.count || 0,
        class_count: classRes.count || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create school
    if (action === "create-school") {
      const { name, code, address, admin_username, admin_password } = await req.json();

      const { data: existing } = await supabase.from("schools").select("id").eq("code", code).single();
      if (existing) {
        return new Response(
          JSON.stringify({ error: "Kode sekolah sudah digunakan" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: school, error: schoolError } = await supabase
        .from("schools")
        .insert({ name, code, address })
        .select()
        .single();
      if (schoolError) throw schoolError;

      const { data: hashedPw } = await supabase.rpc("hash_password", { password: admin_password });
      const { error: adminError } = await supabase
        .from("admin_users")
        .insert({ username: admin_username, password_hash: hashedPw, school_id: school.id });
      if (adminError) throw adminError;

      return new Response(
        JSON.stringify({ success: true, school }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update school (toggle status)
    if (action === "update-school") {
      const { id, name, code, address, is_active } = await req.json();
      const { data, error } = await supabase
        .from("schools")
        .update({ name, code, address, is_active })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete school
    if (action === "delete-school") {
      const { id } = await req.json();
      
      // Delete related data first
      await supabase.from("pengurus_kelas_access").delete().eq("school_id", id);
      await supabase.from("grades").delete().eq("school_id", id);
      await supabase.from("journals").delete().eq("school_id", id);
      await supabase.from("attendance").delete().eq("school_id", id);
      await supabase.from("students").delete().eq("school_id", id);
      await supabase.from("teachers").delete().eq("school_id", id);
      await supabase.from("subjects").delete().eq("school_id", id);
      await supabase.from("class_locations").delete().eq("school_id", id);
      await supabase.from("classes").delete().eq("school_id", id);
      await supabase.from("admin_users").delete().eq("school_id", id);
      
      const { error } = await supabase.from("schools").delete().eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Action not found" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
