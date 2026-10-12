import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "../components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500"><Compass className="h-8 w-8" /></span>
      <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
      <p className="mt-2 text-slate-500">We couldn’t find that page.</p>
      <Link to="/" className="mt-6"><Button>Back to home</Button></Link>
    </div>
  );
}
