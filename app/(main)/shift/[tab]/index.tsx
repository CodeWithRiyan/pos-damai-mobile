import CurrentShift from "@/components/screens/shift/current";
import HistoryShift from "@/components/screens/shift/history";
import { useLocalSearchParams } from "expo-router";

export default function HistoryShiftScreen() {
    const { tab } = useLocalSearchParams()
    if (tab === "current") return <CurrentShift />
    
    return <HistoryShift />
}