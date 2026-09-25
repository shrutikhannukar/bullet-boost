import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Download,
  FileText,
  History,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_CHARACTERS = 500;
const HISTORY_KEY = "bulletboost-history";

const industries = ["Tech", "Sales", "Marketing", "Finance", "HR", "Operations", "Customer Success", "Education"];
const experienceLevels = [
  { label: "Entry-level", detail: "0-2 years" },
  { label: "Mid-level", detail: "3-5 years" },
  { label: "Senior", detail: "5+ years" },
];

type HistoryItem = {
  id: string;
  createdAt: string;
  achievement: string;
  industry: string;
  experience: string;
  bullets: string[];
};

const fallbackBullets = (achievement: string, industry: string, experience: string) => {
  const metric = achievement.match(/\d+(?:\.\d+)?%?|\$\s?\d+(?:,\d+)*(?:\.\d+)?[KMB]?/i)?.[0] ?? "25%";
  const subject = achievement.replace(/[.!?]+$/, "");
  return [
    `${subject}, delivering ${metric} impact while applying ${industry.toLowerCase()} best practices and clear ownership.`,
    `Translated ${subject.toLowerCase()} into measurable outcomes, improving team execution and stakeholder confidence by ${metric}.`,
    `Partnered cross-functionally to deliver ${subject.toLowerCase()}, strengthening processes and supporting ${experience.toLowerCase()}-level goals.`,
    `Used data, prioritization, and structured problem-solving to turn ${subject.toLowerCase()} into repeatable ${industry.toLowerCase()} results.`,
    `Communicated progress and insights to key stakeholders, helping sustain ${metric} performance gains beyond the initial launch.`,
  ];
};

const cleanBullet = (bullet: string) => bullet.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim();

const Index = () => {
  const [achievement, setAchievement] = useState("");
  const [industry, setIndustry] = useState("Tech");
  const [experience, setExperience] = useState("Entry-level");
  const [bullets, setBullets] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(HISTORY_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const selectedExperience = useMemo(
    () => experienceLevels.find((level) => level.label === experience),
    [experience],
  );

  const saveHistory = (nextItem: HistoryItem) => {
    setHistory((current) => {
      const next = [nextItem, ...current.filter((item) => item.achievement !== nextItem.achievement)].slice(0, 4);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const generateBullets = async (event: FormEvent) => {
    event.preventDefault();
    if (!achievement.trim() || isGenerating) return;

    setIsGenerating(true);
    setCopied(false);
    setNotice("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievement: achievement.trim(),
          industry,
          experience: `${experience} (${selectedExperience?.detail})`,
        }),
      });

      if (!response.ok) throw new Error("Claude API unavailable");
      const result = await response.json();
      const generated = Array.isArray(result.bullets) ? result.bullets.map(cleanBullet).filter(Boolean).slice(0, 5) : [];
      if (generated.length !== 5) throw new Error("Incomplete response");
      setBullets(generated);
      saveHistory({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        achievement: achievement.trim(),
        industry,
        experience,
        bullets: generated,
      });
    } catch {
      const generated = fallbackBullets(achievement.trim(), industry, experience);
      setBullets(generated);
      setNotice("Preview bullets shown — add your Claude API key to unlock live generation.");
      saveHistory({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        achievement: achievement.trim(),
        industry,
        experience,
        bullets: generated,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(bullets.map((bullet) => `• ${bullet}`).join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadBullets = () => {
    const content = bullets.map((bullet) => `• ${bullet}`).join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulletboost-resume-bullets.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const restoreHistory = (item: HistoryItem) => {
    setAchievement(item.achievement);
    setIndustry(item.industry);
    setExperience(item.experience);
    setBullets(item.bullets);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#0d1015] text-[#f4f7fb]">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[8%] top-24 h-32 w-32 rounded-full border border-[#4f8cff]/10" />
        <div className="absolute right-[7%] top-[38%] h-48 w-48 rounded-full border border-[#9274ff]/10" />
        <div className="absolute bottom-12 left-[43%] h-px w-40 bg-[#4f8cff]/20" />
      </div>

      <header className="relative border-b border-white/[0.07] bg-[#0d1015]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#4f8cff]/40 bg-[#17243a] text-[#76a6ff] shadow-[0_0_24px_rgba(79,140,255,0.16)]">
              <WandSparkles size={20} strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight">BulletBoost</span>
                <span className="hidden rounded-full border border-[#4f8cff]/30 bg-[#17243a] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#8cb4ff] sm:inline-flex">Beta</span>
              </div>
              <p className="text-[11px] font-medium text-[#778196]">Resume writing, accelerated.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#8792a6]">
            <span className="hidden items-center gap-2 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#52d69b]" /> Local workspace</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#1b202a] font-semibold text-[#b8c2d3]">JB</div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 lg:px-10 lg:pt-16">
        <section className="mb-12 max-w-3xl animate-[fade-up_600ms_ease-out_both]">
          <div className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[#6f9eff]"><span className="h-px w-8 bg-[#4f8cff]" /> AI resume studio</div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-6xl">Resume Bullet Point <span className="text-[#6f9eff]">Generator</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#929daf] sm:text-lg">AI-powered bullets that get interviews. Turn your real work into clear, confident achievements recruiters notice.</p>
          <div className="mt-7 flex flex-wrap gap-5 text-xs font-medium text-[#768195]">
            <span className="flex items-center gap-2"><Check size={14} className="text-[#52d69b]" /> ATS-ready language</span>
            <span className="flex items-center gap-2"><Check size={14} className="text-[#52d69b]" /> Quantified impact</span>
            <span className="flex items-center gap-2"><Check size={14} className="text-[#52d69b]" /> Built for your level</span>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form onSubmit={generateBullets} className="animate-[fade-up_600ms_120ms_ease-out_both] rounded-2xl border border-white/[0.09] bg-[#151920] p-5 shadow-2xl shadow-black/10 sm:p-7">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f9eff]">Step 01</p>
                <h2 className="text-xl font-semibold tracking-tight text-white">Tell us what you did</h2>
                <p className="mt-2 text-sm leading-6 text-[#7e899c]">Start with the work. We’ll sharpen the story.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-[#1c222d] text-[#72809a]"><FileText size={18} /></div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label htmlFor="achievement" className="text-sm font-medium text-[#dce2ec]">Your Achievement or Responsibility</Label>
                  <span className={`text-[11px] tabular-nums ${achievement.length > MAX_CHARACTERS ? "text-[#ff7d91]" : "text-[#6f7b8e]"}`}>{achievement.length}/{MAX_CHARACTERS}</span>
                </div>
                <Textarea id="achievement" value={achievement} maxLength={MAX_CHARACTERS} onChange={(event) => setAchievement(event.target.value)} placeholder="e.g., Led marketing campaign that increased revenue by 30%" className="min-h-[136px] resize-none rounded-xl border-white/[0.1] bg-[#0f131a] px-4 py-3.5 text-sm leading-6 text-white placeholder:text-[#576274] focus:border-[#4f8cff] focus:ring-[#4f8cff]/20" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium text-[#dce2ec]">Industry</Label>
                  <div className="relative">
                    <select id="industry" value={industry} onChange={(event) => setIndustry(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-white/[0.1] bg-[#0f131a] px-3.5 pr-10 text-sm text-[#dce2ec] outline-none transition focus:border-[#4f8cff]">
                      {industries.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-3.5 text-[#758196]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-medium text-[#dce2ec]">Experience Level</Label>
                  <div className="relative">
                    <select id="experience" value={experience} onChange={(event) => setExperience(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-white/[0.1] bg-[#0f131a] px-3.5 pr-10 text-sm text-[#dce2ec] outline-none transition focus:border-[#4f8cff]">
                      {experienceLevels.map((item) => <option key={item.label} value={item.label}>{item.label} ({item.detail})</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-3.5 text-[#758196]" />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={!achievement.trim() || isGenerating} className="group h-12 w-full rounded-xl bg-[#4f8cff] font-semibold text-white shadow-[0_8px_28px_rgba(79,140,255,0.2)] transition hover:bg-[#639aff] disabled:cursor-not-allowed disabled:bg-[#27334a] disabled:text-[#77839a]">
                {isGenerating ? <><LoaderCircle size={17} className="mr-2 animate-spin" /> Writing your bullets...</> : <><Sparkles size={17} className="mr-2" /> Generate Bullets <ArrowRight size={16} className="ml-auto transition group-hover:translate-x-1" /></>}
              </Button>
              <p className="text-center text-[11px] text-[#606c7e]">Your input stays private in this workspace.</p>
            </div>
          </form>

          <section className="animate-[fade-up_600ms_240ms_ease-out_both] rounded-2xl border border-white/[0.09] bg-[#151920] p-5 shadow-2xl shadow-black/10 sm:p-7" aria-live="polite">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f9eff]">Step 02</p>
                <h2 className="text-xl font-semibold tracking-tight text-white">Your bullet set</h2>
                <p className="mt-2 text-sm leading-6 text-[#7e899c]">Five polished ways to frame your impact.</p>
              </div>
              {bullets.length > 0 && <div className="flex gap-2"><Button type="button" variant="outline" onClick={copyAll} className="h-9 rounded-lg border-white/[0.1] bg-transparent px-3 text-xs text-[#aeb9ca] hover:bg-white/[0.06] hover:text-white">{copied ? <Check size={14} className="mr-1.5 text-[#52d69b]" /> : <Copy size={14} className="mr-1.5" />}{copied ? "Copied" : "Copy All"}</Button><Button type="button" variant="outline" onClick={downloadBullets} className="h-9 rounded-lg border-white/[0.1] bg-transparent px-3 text-xs text-[#aeb9ca] hover:bg-white/[0.06] hover:text-white"><Download size={14} className="mr-1.5" /> .txt</Button></div>}
            </div>

            {bullets.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-[#10141b] px-8 text-center">
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#4f8cff]/25 bg-[#17243a] text-[#6f9eff]"><FileText size={31} strokeWidth={1.5} /><Sparkles size={13} className="absolute -right-2 -top-2 text-[#a080ff]" /></div>
                <h3 className="text-sm font-semibold text-[#dce2ec]">Your best bullets start here</h3>
                <p className="mt-2 max-w-xs text-xs leading-5 text-[#6f7b8e]">Share an achievement on the left and your tailored, ATS-friendly bullets will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#4f8cff]/20 bg-[#edf2f9] p-2 shadow-inner">
                  {bullets.map((bullet, index) => <div key={`${bullet}-${index}`} className="flex gap-3 rounded-lg px-3 py-3 text-sm leading-6 text-[#273246] transition hover:bg-white"><span className="mt-0.5 font-semibold text-[#4f8cff]">•</span><span>{bullet}</span></div>)}
                </div>
                <div className="flex items-center gap-2 px-1 pt-1 text-[11px] text-[#667286]"><Check size={13} className="text-[#52d69b]" /> Ready to paste into your resume</div>
                {notice && <p className="rounded-lg border border-[#d6a94e]/20 bg-[#d6a94e]/[0.06] px-3 py-2 text-[11px] leading-5 text-[#d5b76e]">{notice}</p>}
              </div>
            )}
          </section>
        </section>

        {history.length > 0 && <section className="mt-5 rounded-2xl border border-white/[0.09] bg-[#151920] p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1c222d] text-[#8491a8]"><History size={17} /></div><div><h2 className="text-sm font-semibold text-[#e7ebf2]">Recent generations</h2><p className="mt-0.5 text-xs text-[#6f7b8e]">Saved locally for your next edit.</p></div></div><Clock3 size={16} className="text-[#596579]" /></div>
          <div className="grid gap-2 md:grid-cols-2">
            {history.map((item) => <button key={item.id} type="button" onClick={() => restoreHistory(item)} className="group flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#10141b] px-4 py-3 text-left transition hover:border-[#4f8cff]/30 hover:bg-[#172034]"><span className="min-w-0"><span className="block truncate text-sm text-[#c4ccda]">{item.achievement}</span><span className="mt-1 block text-[11px] text-[#68758a]">{item.industry} · {item.experience}</span></span><RotateCcw size={14} className="shrink-0 text-[#66758e] transition group-hover:text-[#6f9eff]" /></button>)}
          </div>
        </section>}
      </main>

      <footer className="relative border-t border-white/[0.07] px-5 py-6 text-center text-[11px] text-[#5f6b7d] sm:px-8">BulletBoost <span className="mx-2 text-[#394252]">/</span> Make your experience impossible to overlook.</footer>
    </div>
  );
};

export default Index;
