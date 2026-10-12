import { Bell, CalendarCheck, Download, KeyRound, LineChart, MapPin, QrCode, UserCircle } from "lucide-react";
import { Card, PageHeader } from "../../components/ui";

const STEPS = [
  { icon: KeyRound, title: "Enter the code", text: "Type the 6-character code your teacher shows. It’s checked instantly — you’ll see the subject, teacher and whether it’s still valid." },
  { icon: QrCode, title: "…or scan the QR", text: "Tap “Scan QR” and point your camera at the teacher’s screen. Attendance is marked automatically." },
  { icon: MapPin, title: "Allow location", text: "You must be close to the classroom (within about 100 m). Allow location access when your browser asks." },
];
const MORE = [
  { icon: CalendarCheck, title: "History", text: "Filter by subject or date and export everything as a CSV file." },
  { icon: LineChart, title: "Analysis", text: "Monthly percentages per subject, plus a calculator that tells you how many classes you need — or can skip." },
  { icon: Bell, title: "Notifications", text: "Notices from teachers and admin. The red badge shows how many you haven’t read." },
  { icon: UserCircle, title: "Profile", text: "Update your details, semester and photo. Your date of birth is your password." },
  { icon: Download, title: "Having trouble?", text: "If a code is rejected, check that it hasn’t expired and that it’s for your class. Still stuck? Tell your class teacher." },
];

export default function StudentHelp() {
  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader title="How to use the portal" subtitle="Everything you need in a minute." />
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Marking attendance</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <Card key={title} className="p-5">
              <div className="mb-3 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">{i + 1}</span><Icon className="h-5 w-5 text-indigo-500" /></div>
              <h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{text}</p>
            </Card>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Other features</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {MORE.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="flex gap-3 p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-5 w-5" /></span><div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-0.5 text-sm text-slate-500">{text}</p></div></Card>
          ))}
        </div>
      </section>
    </div>
  );
}
