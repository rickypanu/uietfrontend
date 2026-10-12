import { BookOpen, KeyRound, Layers, Megaphone, QrCode, Table2 } from "lucide-react";
import { Card, PageHeader } from "../../components/ui";

const ITEMS = [
  { icon: Layers, title: "1 · Create your classes", text: "Under “Classes & registers”, add each class you teach: course, branch, semester, section and subject. Do this once." },
  { icon: KeyRound, title: "2 · Start a session", text: "On the dashboard pick how many minutes the code should stay valid and press OTP or QR code. Allow location access — students must be near you to mark attendance." },
  { icon: QrCode, title: "3 · Share the code", text: "Use “Project” to show a large QR code or OTP on the classroom screen. Students scan it or type the code in their portal." },
  { icon: BookOpen, title: "4 · Watch it live", text: "Attendance appears in real time. Select any of today’s sessions to see who marked present and export the list." },
  { icon: Table2, title: "5 · Open the register", text: "Each class has a monthly register with one column per lecture, percentages, charts, and a CSV export. Use the filters to find students below 75%." },
  { icon: Megaphone, title: "6 · Notify a class", text: "Send a notice (with an optional file) to a class. It expires automatically at the time you choose." },
];

export default function TeacherHelp() {
  return (
    <div className="animate-fade-up">
      <PageHeader title="Teacher guide" subtitle="From first login to the monthly register." />
      <div className="grid gap-4 md:grid-cols-2">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="flex gap-4 p-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></span><div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{text}</p></div></Card>
        ))}
      </div>
    </div>
  );
}
