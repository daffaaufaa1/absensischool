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
    const { nis_nit, password } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Try student first
    const { data: student } = await supabase
      .from("students")
      .select("*, classes(name)")
      .eq("nis", nis_nit)
      .single();

    if (student) {
      const { data: isValid } = await supabase.rpc("verify_password", {
        input_password: password,
        stored_hash: student.password_hash,
      });

      if (isValid) {
        // Sign in or create Supabase auth user for session
        const email = `${nis_nit}@siswa.fadam.sch.id`;
        
        // Try to sign in first
        const { data: signInData, error: signInError } = await supabase.auth.admin.listUsers();
        const existingUser = signInData?.users?.find(u => u.email === email);
        
        let userId: string;
        
        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create auth user
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: student.full_name, role: 'siswa' },
          });
          if (createError) throw createError;
          userId = newUser.user.id;

          // Create profile
          await supabase.from("profiles").insert({
            user_id: userId,
            full_name: student.full_name,
            class: student.classes?.name || null,
          });

          // Create role
          await supabase.from("user_roles").insert({
            user_id: userId,
            role: "siswa",
          });
        }

        // Generate session token
        const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
        });

        return new Response(
          JSON.stringify({
            success: true,
            role: "siswa",
            email,
            user_id: userId,
            full_name: student.full_name,
            class: student.classes?.name || null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Try teacher
    const { data: teacher } = await supabase
      .from("teachers")
      .select("*")
      .eq("nit", nis_nit)
      .single();

    if (teacher) {
      const { data: isValid } = await supabase.rpc("verify_password", {
        input_password: password,
        stored_hash: teacher.password_hash,
      });

      if (isValid) {
        const email = `${nis_nit}@guru.fadam.sch.id`;
        
        const { data: signInData } = await supabase.auth.admin.listUsers();
        const existingUser = signInData?.users?.find(u => u.email === email);
        
        let userId: string;
        
        if (existingUser) {
          userId = existingUser.id;
        } else {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: teacher.full_name, role: 'guru' },
          });
          if (createError) throw createError;
          userId = newUser.user.id;

          await supabase.from("profiles").insert({
            user_id: userId,
            full_name: teacher.full_name,
          });

          await supabase.from("user_roles").insert({
            user_id: userId,
            role: "guru",
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            role: "guru",
            email,
            user_id: userId,
            full_name: teacher.full_name,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "NIS/NIT atau password salah" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
