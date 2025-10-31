import React, { createContext, useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [sessionUser, setSessionUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleAuthError = useCallback(
    async (error, contextMessage) => {
      console.error(`AuthContext Error (${contextMessage}):`, error.message);

      const isInvalidTokenError =
        error.message &&
        (error.message.includes("Invalid Refresh Token") ||
          error.code === "refresh_token_not_found");
      const isFetchError =
        error.message &&
        error.message.toLowerCase().includes("failed to fetch");

      if (isInvalidTokenError || isFetchError) {
        console.warn(
          "AuthContext: Invalid session or connection issue. Forcing sign-out to clear state."
        );
        const toastMessage = isFetchError
          ? "Connection Issue: Could not verify session. Please log in again."
          : "Session Expired: Your session has expired. Please log in again.";

        toast({
          variant: "destructive",
          title: isFetchError ? "Connection Issue" : "Session Expired",
          description: toastMessage,
          duration: 7000,
        });

        await supabase.auth.signOut();
        setSessionUser(null);
        setUser(null);
        setLoading(false);
        return true; // Indicates a clean-up was performed
      }
      return false;
    },
    [toast]
  );

  useEffect(() => {
    setLoading(true);
    let mounted = true;

    const fetchSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (sessionError) {
          const cleaned = await handleAuthError(sessionError, "fetchSession");
          if (!cleaned) {
            toast({
              variant: "destructive",
              title: "Session Error",
              description: "Could not fetch your session details.",
            });
            setSessionUser(null);
          }
        } else {
          setSessionUser(session?.user ?? null);
        }
      } catch (error) {
        if (!mounted) return;
        await handleAuthError(error, "fetchSession critical");
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setSessionUser(null);
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session) {
        setSessionUser(session.user);
      } else if (session) {
        setSessionUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [toast, handleAuthError]);

  useEffect(() => {
    let mounted = true;
    if (sessionUser) {
      const fetchProfile = async () => {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", sessionUser.id)
            .single();

          if (!mounted) return;

          if (error && error.code !== "PGRST116") {
            console.error(
              "AuthContext: Error fetching profile:",
              error.message
            );
            toast({
              variant: "destructive",
              title: "Profile Error",
              description: "Could not fetch your profile details.",
            });
            setUser(sessionUser); // Fallback to session user
          } else {
            setUser({ ...sessionUser, profile: profile || null });
          }
        } catch (error) {
          if (!mounted) return;
          console.error("AuthContext: Critical error fetching profile:", error);
          toast({
            variant: "destructive",
            title: "Critical Profile Error",
            description:
              "An unexpected error occurred while fetching your profile.",
          });
          setUser(sessionUser); // Fallback
        } finally {
          if (mounted) setLoading(false);
        }
      };
      fetchProfile();
    } else {
      setUser(null);
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [sessionUser, toast]);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast({
              variant: "destructive",
              title: "Login Failed: Email Not Confirmed",
              description:
                "Please check your email (and spam folder) for a confirmation link to activate your account.",
              duration: 7000,
            });
          } else {
            toast({
              variant: "destructive",
              title: "Login Failed",
              description:
                error.message || "Invalid credentials or network issue.",
            });
          }
          throw error;
        }
        toast({
          title: "Login Successful",
          description: `Welcome back${
            data.user?.user_metadata?.name
              ? ", " + data.user.user_metadata.name
              : ""
          }!`,
        });
        return data.user;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    [toast]
  );

  const register = useCallback(
    async (formData, inviteToken = null) => {
      setLoading(true);
      try {
        const {
          name,
          email,
          password,
          screenName,
          country,
          stateProvince,
          company,
          role,
        } = formData;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: {
              name,
              screen_name: screenName,
              country,
              state_province: stateProvince,
              company,
              role,
            },
          },
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.message.includes("User already registered")
              ? "This email is already registered. Please log in."
              : error.message,
          });
          throw error;
        }

        if (data.user) {
          const description = data.session
            ? "Welcome! Your account is active."
            : "Please check your email (and spam folder) for a confirmation link to activate your account.";
          toast({
            title: "Registration Successful!",
            description,
            duration: data.session ? 5000 : 10000,
          });
        }

        return data.user;
      } catch (error) {
        console.error("Registration process error:", error);
        throw error;
      }
    },
    [toast]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message,
      });
    } finally {
      setSessionUser(null);
      setUser(null);
      setLoading(false);
    }
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
