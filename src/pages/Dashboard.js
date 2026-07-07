import { useEffect, useState } from "react";

import { supabase } from "../supabaseClient";
import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";

export default function Dashboard() {
  const [profile, setProfile] =
    useState(null);

  const [isProfileLoading, setIsProfileLoading] =
    useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!user) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      const { data } =
        await supabase
          .from("userTable")
          .select("full_name, email, role")
          .eq("id", user.id)
          .maybeSingle();

      if (!isMounted) {
        return;
      }

      const fallbackProfile = {
        id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.full_name ||
          user.email,
        role:
          user.user_metadata?.role ||
          "teacher",
      };

      let profileRow =
        data;

      if (!profileRow) {
        const { data: createdProfile } =
          await supabase
            .from("userTable")
            .upsert([
              {
                id: fallbackProfile.id,
                full_name: fallbackProfile.full_name,
                email: fallbackProfile.email,
                role: fallbackProfile.role,
              },
            ])
            .select("full_name, email, role")
            .maybeSingle();

        profileRow =
          createdProfile ?? fallbackProfile;
      }

      if (!isMounted) {
        return;
      }

      setProfile({
        id: user.id,
        email: profileRow?.email || user.email,
        full_name:
          profileRow?.full_name ||
          user.user_metadata?.full_name ||
          user.email,
        role:
          profileRow?.role ||
          user.user_metadata?.role ||
          "teacher",
      });
      setIsProfileLoading(false);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isProfileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f3ef] px-6 text-center text-gray-950">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
            WriteCheck 
          </p>
          <h1 className="mt-3 text-3xl font-black">
            Loading dashboard
          </h1>
        </div>
      </div>
    );
  }

  if (profile?.role === "student") {
    return <StudentDashboard profile={profile} />;
  }

  return <TeacherDashboard profile={profile} />;
}



