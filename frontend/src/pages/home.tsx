import ButtonRectangular from "@/components/button-rectangular";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useUserStore } from "@/hooks/use-user";
import Dashboard from "@/components/dashboard";

export default function Home() {
  const navigate = useNavigate();
  const { userStats } = useUserStore();
  const { userId } = useAuth();

  return (
    <>
      {!userId ? (
        <div className="flex w-full max-w-hero flex-col items-center justify-start gap-4  text-center">
          <h1>Angličtina</h1>
          <p className="px-4">
            Trénujte 400 slovíček či 200 vět za 20 minut denně, a dosáhněte
            základní znalosti jazyka za zlomek běžného učebního času.
          </p>
          <p className="text-notice">aplikace v testovacím režimu</p>
          <ButtonRectangular
            className="grow-0 max-w-card w-full mt-8"
            onClick={() => navigate("/login")}
          >
            Sign in / Sign up
          </ButtonRectangular>
        </div>
      ) : (
        <Dashboard
          allCount={userStats?.learnedCount || 0}
          todayCount={userStats?.learnedCountToday || 0}
        />
      )}
    </>
  );
}
