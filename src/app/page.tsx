import { Dashboard } from "@/components/dashboard";

export default function Home() {
  const showSettings = process.env.SHOW_SETTINGS === "true";
  return <Dashboard showSettings={showSettings} />;
}
