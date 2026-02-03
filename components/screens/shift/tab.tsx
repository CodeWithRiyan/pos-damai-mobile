import CurrentShift from "@/components/screens/shift/current";
import CurrentFormShift from "@/components/screens/shift/current-form";
import HistoryShift from "@/components/screens/shift/history";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";

export default function TabShift() {
  const [shiftActive, setShiftActive] = useState<boolean>(false);
  const { tab } = useLocalSearchParams();
  if (tab === "current" && !shiftActive)
    return <CurrentFormShift setActive={setShiftActive} />;
  if (tab === "current" && shiftActive)
    return <CurrentShift setActive={setShiftActive} />;

  return <HistoryShift />;
}
