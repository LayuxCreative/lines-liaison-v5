import { supabase } from "../config/supabase";

export const checkAdminUserExists = async (): Promise<boolean> => {
  try {
    const { data: existingUser, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "admin@lines-liaison.xyz")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking admin user:", error);
      return false;
    }

    return !!existingUser;
  } catch (error) {
    console.error("Error checking admin user:", error);
    return false;
  }
};

export const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "admin@lines-liaison.xyz")
      .single();

    if (existingUser) {
      return { success: true, message: "Admin user already exists" };
    }

    // TODO: Replace with secure password in production
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: "admin@lines-liaison.xyz",
      password: process.env.ADMIN_PASSWORD || "secure_password_123",
      options: {
        data: {
          full_name: "Administrator",
          role: "admin",
        },
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create user" };
    }

    // Create profile for admin user
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: "admin@lines-liaison.xyz",
      full_name: "Administrator",
      role: "admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Profile error:", profileError);
      return { success: false, error: profileError.message };
    }

    return { success: true, message: "Admin user created successfully" };
  } catch (error) {
    console.error("Create admin error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};
