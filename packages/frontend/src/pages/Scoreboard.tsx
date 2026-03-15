import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { eden } from "../eden";
import { Trophy, Medal, Crown, Award, Star, Calendar } from "lucide-react";

interface ScoreboardEntry {
  rank: number;
  userId: string;
  name: string;
  profilePicture: string | null;
  eventsWorked: number;
}

const periodOptions = [
  { value: "semester", labelKey: "period.thisSemester" },
  { value: "year", labelKey: "period.thisYear" },
  { value: "month", labelKey: "period.thisMonth" },
  { value: "all", labelKey: "period.allTime" },
];

const rankIcons: Record<number, React.ReactNode> = {
  1: <Crown className="w-6 h-6 text-yellow-500" />,
  2: <Medal className="w-6 h-6 text-gray-400" />,
  3: <Award className="w-6 h-6 text-amber-600" />,
};

const rankClasses: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-800 border-yellow-300",
  2: "bg-gray-100 text-gray-800 border-gray-300",
  3: "bg-amber-100 text-amber-800 border-amber-300",
};

export function Scoreboard() {
  const { t } = useTranslation("scoreboard");
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [period, setPeriod] = useState("semester");
  const [periodLabel, setPeriodLabel] = useState("This Semester");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchScoreboard();
  }, [period]);

  async function fetchScoreboard() {
    setIsLoading(true);
    const { data } = await eden.scoreboard.get({
      query: { period },
    });
    if (data) {
      setScoreboard(data.scoreboard || []);
      const currentOption = periodOptions.find((p) => p.value === period);
      setPeriodLabel(data.periodLabel || t(currentOption?.labelKey as string) || "");
    }
    setIsLoading(false);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-accent" />
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-base-content/70">{t("subtitle")}</p>
      </div>

      {/* Period Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            className={`btn btn-sm ${
              period === option.value ? "btn-primary" : "btn-ghost"
            }`}
            onClick={() => setPeriod(option.value)}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>

      {/* Scoreboard */}
      <div className="card bg-base-100 shadow-xl max-w-3xl mx-auto">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : scoreboard.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <Medal className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("noScores")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Top 3 Podium-style display */}
              {scoreboard.slice(0, 3).length > 0 && (
                <div className="flex justify-center items-end gap-4 mb-8 py-4">
                  {scoreboard[1] && (
                    <div className="text-center">
                      <div className="w-20 h-24 bg-gray-200 rounded-t-lg flex items-center justify-center text-2xl font-bold text-gray-600">
                        2
                      </div>
                      <div className="bg-gray-100 p-2 rounded-b-lg">
                        <p className="font-semibold text-sm truncate max-w-[100px]">
                          {scoreboard[1].name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {scoreboard[1].eventsWorked} events
                        </p>
                      </div>
                    </div>
                  )}
                  {scoreboard[0] && (
                    <div className="text-center -mt-4">
                      <Crown className="w-8 h-8 mx-auto text-yellow-500 mb-1" />
                      <div className="w-24 h-32 bg-yellow-200 rounded-t-lg flex items-center justify-center text-3xl font-bold text-yellow-700">
                        1
                      </div>
                      <div className="bg-yellow-100 p-2 rounded-b-lg">
                        <p className="font-bold truncate max-w-[120px]">
                          {scoreboard[0].name}
                        </p>
                        <p className="text-sm text-yellow-700">
                          {scoreboard[0].eventsWorked} events
                        </p>
                      </div>
                    </div>
                  )}
                  {scoreboard[2] && (
                    <div className="text-center">
                      <div className="w-20 h-20 bg-amber-200 rounded-t-lg flex items-center justify-center text-2xl font-bold text-amber-700">
                        3
                      </div>
                      <div className="bg-amber-100 p-2 rounded-b-lg">
                        <p className="font-semibold text-sm truncate max-w-[100px]">
                          {scoreboard[2].name}
                        </p>
                        <p className="text-xs text-amber-600">
                          {scoreboard[2].eventsWorked} events
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Full list */}
              <div className="divide-y divide-base-200">
                {scoreboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 py-3 px-4 rounded-lg ${
                      entry.rank <= 3 ? "bg-base-200/50" : ""
                    }`}
                  >
                    {/* Rank */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        rankClasses[entry.rank] ||
                        "bg-base-300 text-base-content"
                      }`}
                    >
                      {rankIcons[entry.rank] || entry.rank}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center text-lg font-bold">
                      {entry.profilePicture ? (
                        <img
                          src={entry.profilePicture}
                          alt={entry.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        entry.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1">
                      <p className="font-semibold">{entry.name}</p>
                      {entry.rank === 1 && (
                        <span className="badge badge-sm badge-warning gap-1">
                          <Star className="w-3 h-3" /> Leader
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.eventsWorked}</p>
                      <p className="text-xs text-base-content/70">events</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
