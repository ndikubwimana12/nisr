import { Link } from "react-router-dom";
import { ArrowRight, Compass, Landmark, MapPinned, Wheat } from "lucide-react";
import { useData } from "../data";
import { fmt } from "../format";
import DistrictShowcase from "../components/DistrictShowcase";
import { useLanguage } from "../language";
import { HELP_TOPICS } from "../components/Layout";
import { Section } from "../components/ui";

const START = [
  { to: "/my-farm", icon: Wheat, title: "Estimate my harvest", text: "Answer 5 quick questions and get a written report for your field.", who: "For farmers" },
  { to: "/rwanda#where-to-act", icon: Landmark, title: "Where to invest", text: "Districts that need water, fertilizer or training first.", who: "For planners" },
  { to: "/districts", icon: MapPinned, title: "My district", text: "Everything the survey found about farming in one district.", who: "For everyone" },
  { to: "/rwanda", icon: Compass, title: "Rwanda at a glance", text: "The big picture: key findings and maps for all 30 districts.", who: "For everyone" },
];

export default function Home() {
  const D = useData();
  const { language } = useLanguage();
  const startText = language === "rw" ? [
    ["Teganya umusaruro wanjye", "Subiza ibibazo 5 bigufi ubone raporo y'umurima wawe."],
    ["Aho gushyira imbaraga", "Akarere gakeneye amazi, ifumbire cyangwa amahugurwa."],
    ["Akarere kanjye", "Reba ibyo ubushakashatsi bwabonye ku buhinzi mu karere."],
    ["U Rwanda muri make", "Iby'ingenzi n'amakarita y'uturere twose 30."],
  ] : START.map((s) => [s.title, s.text]);
  const helpLabels = language === "rw" ? ["Amazi y'ibihingwa", "Ongera uburumbuke bw'ubutaka", "Gereranya umusaruro", "Bika kandi ugurishe imyaka", "Ibihingwa byoherezwa hanze"] : HELP_TOPICS.map((t) => t.label);
  const helpEyebrow = language === "rw" ? "Ukeneye ubufasha ku ki?" : "What do you need help with?";
  const helpTitle = language === "rw" ? "Fashwa ku kibazo cyihariye" : "Get help on a specific problem";

  return (
    <>
      <DistrictShowcase />

      <Section eyebrow={language === "rw" ? "Cyangwa utangire ku cyo ukeneye" : "Or start with what you need"} title={language === "rw" ? "Hitamo aho utangirira" : "Choose a starting point"}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {START.map((s, i) => (
            <Link key={s.title} to={s.to} className="card group flex flex-col gap-2 p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(18,59,122,0.12)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e3eef9] text-nisr-blue"><s.icon size={24} /></span>
              <span className="text-xs font-semibold uppercase tracking-wide text-nisr-muted">{s.who}</span>
              <span className="font-display text-lg text-nisr-navy">{startText[i][0]}</span>
              <span className="flex-1 text-[15px] text-nisr-muted">{startText[i][1]}</span>
              <span className="inline-flex items-center gap-1 font-semibold text-nisr-blue">{language === "rw" ? "Tangira" : "Start"} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </Section>

      <Section alt eyebrow={helpEyebrow} title={helpTitle}
        intro={language === "rw" ? "Ibi bifasha gusubiza ibibazo bikunze kubazwa n'abahinzi n'abategura gahunda, hakoreshejwe ibyavuye mu bushakashatsi." : "Each area answers one of the questions farmers and planners ask most, using the survey data."}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {HELP_TOPICS.map((t, i) => (
            <Link key={t.to} to={t.to} className="card group flex flex-col gap-2 p-5 transition hover:shadow-[0_12px_28px_rgba(18,59,122,0.12)]">
              <t.icon size={26} className="text-nisr-blue" />
              <span className="font-display text-[17px] text-nisr-navy">{helpLabels[i]}</span>
              <span className="flex-1 text-[15px] text-nisr-muted">{t.text}</span>
              <span className="w-fit rounded bg-[#e3eef9] px-1.5 py-0.5 text-[11px] font-semibold text-nisr-blue">Challenge area: {t.challenge}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-4 text-center sm:grid-cols-4">
          {[[fmt(D.survey.households), language === "rw" ? "ingo z'abahinzi zabajijwe" : "farming households surveyed"], [D.survey.districts, language === "rw" ? "uturere twakorewemo ubushakashatsi" : "districts covered"], [fmt(D.survey.cropRecords), language === "rw" ? "ibihingwa byanditswe mu mirima" : "crop records from plots"], [D.farmCrops.length, language === "rw" ? "ibihingwa bifite igereranya ry'umusaruro" : "crops with harvest estimates"]].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-nisr-mist px-4 py-5">
              <b className="num block font-display text-3xl text-nisr-navy">{v}</b>
              <span className="text-[15px] text-nisr-muted">{l}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
