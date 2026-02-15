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
      .select("*, classes(name), schools(id, name, code)")
      .eq("nis", nis_nit)
      .single();

    if (student) {
      const { data: isValid } = await supabase.rpc("verify_password", {
        input_password: password,
        stored_hash: student.password_hash,
      });

      if (isValid) {
        const email = `${nis_nit}@siswa.fadam.sch.id`;
        
        const { data: signInData } = await supabase.auth.admin.listUsers();
        const existingUser = signInData?.users?.find(u => u.email === email);
        
        let userId: string;
        
        if (existingUser) {
          userId = existingUser.id;
          // Update profile school_id if needed
          await supabase.from("profiles").update({ school_id: student.school_id }).eq("user_id", userId);
        } else {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: student.full_name, role: 'siswa', school_id: student.school_id },
          });
          if (createError) throw createError;
          userId = newUser.user.id;

          await supabase.from("profiles").insert({
            user_id: userId,
            full_name: student.full_name,
            class: student.classes?.name || null,
            school_id: student.school_id,
          });

          await supabase.from("user_roles").insert({
            user_id: userId,
            role: "siswa",
            school_id: student.school_id,
          });
        }

        const { data: tokenData } = await supabase.auth.admin.generateLink({
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
            school_id: student.school_id,
            school: student.schools,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Try teacher
    const { data: teacher } = await supabase
      .from("teachers")
      .select("*, schools(id, name, code)")
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
          await supabase.from("profiles").update({ school_id: teacher.school_id }).eq("user_id", userId);
        } else {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: teacher.full_name, role: 'guru', school_id: teacher.school_id },
          });
          if (createError) throw createError;
          userId = newUser.user.id;

          await supabase.from("profiles").insert({
            user_id: userId,
            full_name: teacher.full_name,
            school_id: teacher.school_id,
          });

          await supabase.from("user_roles").insert({
            user_id: userId,
            role: "guru",
            school_id: teacher.school_id,
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            role: "guru",
            email,
            user_id: userId,
            full_name: teacher.full_name,
            school_id: teacher.school_id,
            school: teacher.schools,
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
