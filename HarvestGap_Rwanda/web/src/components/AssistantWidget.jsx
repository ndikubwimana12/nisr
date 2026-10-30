import { useState } from "react";
import { Send, X } from "lucide-react";
import { useData } from "../data";
import { useFarm } from "../farm";
import { COPY, useLanguage } from "../language";
import { answer, completeQuestion, parseQuestion, SUGGESTIONS } from "../advisor";
import { Rich } from "./AskBox";
import agrilensLogo from "../assets/agrilens-logo.png";

function isPlanningQuestion(question) {
  return /\b(want to plant|want to grow|want to crop|want to cultivate|would like to (?:grow|plant)|plan to plant|planning to grow|thinking of planting|what should i plant|which crop should i|which crop can i|recommend a crop|start (?:a )?farm|planting advice|nshaka guhinga|ngomba guhinga|igihingwa nahinga)\b/i.test(question);
}

function planPrompt(answers, D, isRw) {
  const steps = ["crop", "district", "irrigation", "areaHa", "fertilizer"];
  const step = steps.find((key) => !answers[key]);
  const prompt = {
    crop: isRw ? "Ni ikihe gihingwa ushaka guhinga?" : "Which crop would you like to plant?",
    district: isRw ? "Uzahinga mu karere akahe?" : "Which district will you plant in?",
    irrigation: isRw ? "Ufite uburyo bwo kuhira?" : "Do you have access to irrigation?",
    areaHa: isRw ? "Ubuso bw'umurima ni bungana iki? Andika mu ha, nka 0.5 ha." : "How large is the plot? Enter hectares, for example 0.5 ha.",
    fertilizer: isRw ? "Ukunda gukoresha ubuhe bwoko bw'ifumbire?" : "What type of fertilizer do you prefer?",
  };
  if (!step) return { plan: { answers, step: null }, title: "plan-ready" };
  let choices = [];
  if (step === "crop") choices = D.farmCrops.map((value) => ({ value, label: value }));
  if (step === "district") choices = D.districtNames.map((value) => ({ value, label: value }));
  if (step === "irrigation") choices = isRw
    ? [{ value: "Yes", label: "Yego" }, { value: "No", label: "Oya" }, { value: "Shared", label: "Bisangiwe" }, { value: "Not sure", label: "Sinzi" }]
    : ["Yes", "No", "Shared", "Not sure"].map((value) => ({ value, label: value }));
  if (step === "areaHa") choices = ["0.25 ha", "0.5 ha", "1 ha", "2 ha"].map((value) => ({ value, label: value }));
  if (step === "fertilizer") choices = isRw
    ? [{ value: "Organic", label: "Ifumbire y'imborera" }, { value: "Inorganic", label: "Ifumbire mvaruganda" }, { value: "Both", label: "Byombi" }, { value: "Undecided", label: "Ndacyatekereza" }]
    : [{ value: "Organic", label: "Organic / compost" }, { value: "Inorganic", label: "Mineral fertilizer" }, { value: "Both", label: "Both" }, { value: "Undecided", label: "Not decided" }];
  return { plan: { answers, step, choices }, question: prompt[step] };
}

function parseArea(value) {
  const number = Number(String(value).replace(",", ".").match(/[0-9]+(?:\.[0-9]+)?/)?.[0]);
  if (!Number.isFinite(number) || number <= 0) return null;
  const lower = String(value).toLowerCase();
  if (lower.includes("acre")) return number * 0.4047;
  if (lower.includes("sqm") || lower.includes("m²") || lower.includes("m2")) return number / 10000;
  return number;
}

function planningAdvice(answers, D, isRw) {
  const { crop, district, irrigation, areaHa, fertilizer } = answers;
  const local = D.getDistrictCrop(district, crop), national = D.getCrop(crop), area = parseArea(areaHa);
  const districtStats = D.getDistrict(district), scenario = D.getScenario(district, crop);
  const typical = local || national;
  const facts = [
    ...(typical ? [{ label: isRw ? "Umusaruro wo hagati mu bushakashatsi" : "Survey median yield", value: `${Math.round(typical.median).toLocaleString()} kg/ha` }] : []),
    { label: isRw ? "Ubuso" : "Plot size", value: `${area.toFixed(area < 1 ? 2 : 1)} ha` },
    ...(area && typical ? [{ label: isRw ? "Urugero rushingiye ku bushakashatsi" : "Survey-based reference", value: `${Math.round(typical.median * area).toLocaleString()} kg` }] : []),
    ...(scenario ? [{ label: isRw ? "Ishusho y'inyongeramusaruro" : "Input scenario", value: `${Math.round(scenario.withInputs).toLocaleString()} kg/ha` }] : []),
  ];
  const paragraphs = isRw ? [
    `Mu bushakashatsi bwa AHS 2024, ${local ? `imirima ihinga ${crop} muri ${district} yasaruraga hagati ya ${Math.round(local.median).toLocaleString()} kg/ha` : `nta gipimo gihagije cyabonetse muri ${district}; ku rwego rw'u Rwanda ${crop} yasaruraga hagati ya ${typical ? `${Math.round(typical.median).toLocaleString()} kg/ha` : "ntihabonetse igipimo"}`}. Iyi ni imibare yo kugereranya, si isezerano ry'umusaruro wawe.`,
    irrigation === "Yes" || irrigation === "Shared" ? "Koresha amazi make neza: kuhira mu bihe igihingwa kibikeneye, gupfuka ubutaka no kugenzura imiyoboro y'amazi." : "Kubera ko kuhira kutaboneka buri gihe, bika amazi y'imvura, pfunika ubutaka kandi ubaze abajyanama ku mbuto zihanganira amapfa n'igihe cyiza cyo gutera.",
    fertilizer === "Organic" ? "Koresha ifumbire y'imborera iboze neza; yongere mu butaka mbere yo gutera. Baza umujyanama niba hakenewe n'inyongeramusaruro mvaruganda." : fertilizer === "Inorganic" ? "Banza umenye imiterere y'ubutaka. Hitamo ifumbire n'ingano yayo ubifashijwemo n'umujyanama; ntukarenze amabwiriza ari ku gikoresho." : fertilizer === "Both" ? "Guhuza ifumbire y'imborera n'iy'umwimerere bishobora gufasha ubutaka, ariko ingano n'igihe byo kuyishyiramo bigenderwe ku mabwiriza y'abajyanama." : "Banza ugenzure ubutaka kandi ugereranye ikiguzi n'inyungu. Umujyanama wo mu murenge yagufasha guhitamo ifumbire ikubereye n'ingano yayo.",
    "Hitamo imbuto zemewe kandi zijyanye n'akarere, ukurikize intera n'igihe byo gutera biri ku mabwiriza y'imbuto. Kurikirana ibyatsi n'udukoko hakiri kare; nta makuru y'iteganyagihe ry'imvura ahujwe n'iyi porogaramu.",
  ] : [
    local ? `In the AHS 2024 survey, farms growing ${crop} in ${district} had a typical yield of ${Math.round(local.median).toLocaleString()} kg/ha. This is a comparison point, not a promise for your farm.` : `There is no reliable ${crop} estimate for ${district}; the Rwanda-wide survey median was ${typical ? `${Math.round(typical.median).toLocaleString()} kg/ha` : "not available"}. This is a comparison point, not a promise for your farm.`,
    irrigation === "Yes" || irrigation === "Shared" ? "Use water efficiently: irrigate when the crop needs it, mulch to reduce evaporation, and check channels or hoses for leaks." : "Since irrigation is unavailable or limited, store rainwater where feasible, mulch, and ask local extension staff about drought-tolerant varieties and planting timing.",
    fertilizer === "Organic" ? "Use well-composted manure or compost to build soil, and ask an extension officer whether a mineral nutrient is also needed." : fertilizer === "Inorganic" ? "Check soil needs before buying fertilizer. Ask an extension officer for the right product and rate, and follow the package instructions." : fertilizer === "Both" ? "Combining compost with mineral fertilizer may support soil and crop nutrition; follow local soil guidance for the amount and timing." : "Check soil needs and compare costs before choosing fertilizer. A local extension officer can recommend a suitable product and rate.",
    "Choose certified seed suited to your area and follow the seed label or extension guidance for spacing and planting depth. Check weeds and crop health early. This app has no live rainfall forecast.",
  ];
  if (districtStats?.erosion_threat_rate > 0.15) paragraphs.push(isRw ? "Ubutaka bw'akarere bushobora guhura n'isuri; pfuka ubutaka kandi urinde imirima iri ku misozi." : "Erosion is a concern in this district; keep soil covered and protect sloping plots with locally recommended measures.");
  return {
    area: "harvest",
    localized: isRw,
    title: isRw ? `Gahunda yo guhinga ${crop} muri ${district}` : `Plan for growing ${crop} in ${district}`,
    facts,
    paragraphs,
    followUps: isRw ? [`Umusaruro wa ${crop} muri ${district}`, `Amazi yo kuhira muri ${district}`] : [`${crop} harvest in ${district}`, `Water for crops in ${district}`],
  };
}

function KinyarwandaAnswer({ result }) {
  const labels = { "Usual harvest": "Umusaruro usanzwe", "Best farms": "Imirima yageze ku musaruro mwiza", "Based on": "Imirima yabajijwe", "Plots irrigated": "Imirima ivomererwa", "No water nearby": "Nta mazi hafi", "Can't afford it": "Kutabasha kwishyura kuhira", "Use fertilizer": "Ikoresha ifumbire", "Got farm advice": "Yahawe inama" };
  const facts = result.facts || [];
  const localized = result.localized === true;
  return <div className="assistant-answer">
    <h3>{localized ? result.title : result.area === "harvest" ? "Inama ku musaruro wawe" : "Igisubizo ku kibazo cyawe"}</h3>
    {facts.length > 0 && <dl className="assistant-facts">{facts.map((f) => <div key={f.label}><dt>{labels[f.label] || f.label}</dt><dd>{f.value}</dd></div>)}</dl>}
    {localized ? result.paragraphs?.map((p, i) => <p key={i}><Rich text={p} /></p>) : <><p>Ubu ni amakuru ashingiye ku bushakashatsi bwa NISR ku ngo z’ubuhinzi bwo mu Rwanda bwo mu 2024. Umusaruro ushobora gutandukana bitewe n'imvura, ubutaka n'uburyo bwo guhinga.</p><p>Menyesha umujyanama w'ubuhinzi wo mu murenge wawe kugira ngo agufashe guhitamo imbuto, ifumbire n'ingamba zikwiranye n'umurima wawe.</p></>}
    <p className="assistant-source">Ibisubizo bigereranya imirima yo mu bushakashatsi; si isezerano ry'umusaruro.</p>
  </div>;
}

function AssistantMessage({ result, isRw }) {
  if (isRw) return <KinyarwandaAnswer result={result} />;
  return <div className="assistant-answer">
    <h3>{result.title}</h3>
    {result.facts?.length > 0 && <dl className="assistant-facts">{result.facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>}
    {result.paragraphs?.map((p, i) => <p key={i}><Rich text={p} /></p>)}
    <p className="assistant-source">Based on the NISR Agricultural Household Survey 2024. These comparisons are not guarantees of future yield.</p>
  </div>;
}

export default function AssistantWidget() {
  const D = useData(), { farm, setFarm } = useFarm(), { language, isRw } = useLanguage();
  const c = COPY[language];
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  const submitPlanAnswer = (messageIndex, value) => {
    const current = messages[messageIndex];
    if (!current?.result?.plan?.step) return;
    const { answers, step } = current.result.plan;
    const nextAnswers = { ...answers, [step]: step === "areaHa" ? parseArea(value) ? value : null : value };
    if (!nextAnswers[step]) {
      setMessages((all) => all.map((message, index) => index === messageIndex ? { ...message, result: { ...message.result, question: isRw ? "Andika ubuso mu ha, urugero 0.5 ha." : "Enter a valid plot size, such as 0.5 ha." } } : message));
      return;
    }
    if (step === "crop" || step === "district") setFarm(step === "crop" ? { crop: value } : { district: value });
    const next = planPrompt(nextAnswers, D, isRw);
    const result = next.plan.step ? next : planningAdvice(nextAnswers, D, isRw);
    setMessages((all) => all.map((message, index) => index === messageIndex ? { ...message, result } : message));
  };

  const ask = (raw) => {
    const question = raw.trim();
    if (!question) return;
    const activePlan = messages.findLastIndex?.((message) => message.result?.plan?.step) ?? -1;
    if (activePlan >= 0) {
      if (/^(cancel|stop|reka|hagarika)$/i.test(question)) {
        setMessages((all) => all.map((message, index) => index === activePlan ? { ...message, result: { localized: isRw, title: isRw ? "Gahunda yahagaritswe" : "Planning stopped", paragraphs: [isRw ? "Ushobora kongera gutangira igihe cyose." : "You can start a crop plan whenever you are ready."] } } : message));
      } else submitPlanAnswer(activePlan, question);
      setText("");
      return;
    }
    const parsed = parseQuestion(question, D);
    let result;
    if (isPlanningQuestion(question)) {
      const answers = { crop: parsed.crop || null, district: parsed.district || farm.district || null, irrigation: null, areaHa: null, fertilizer: null };
      const next = planPrompt(answers, D, isRw);
      result = next.plan.step ? next : planningAdvice(answers, D, isRw);
    } else result = answer(question, D, farm);
    if (parsed.district || parsed.crop) setFarm({ ...(parsed.district && { district: parsed.district }), ...(parsed.crop && { crop: parsed.crop }) });
    setMessages((current) => [...current, { question, result }]);
    setText("");
  };
  const pick = (message, value) => {
    const messageIndex = messages.indexOf(message);
    if (message.result.plan?.step) return submitPlanAnswer(messageIndex, value);
    const completed = completeQuestion(message.result, value);
    const parsed = parseQuestion(completed, D);
    const result = answer(completed, D, farm);
    if (parsed.district || parsed.crop) setFarm({ ...(parsed.district && { district: parsed.district }), ...(parsed.crop && { crop: parsed.crop }) });
    setMessages((current) => [...current, { question: value, result }]);
  };
  const options = (result) => result.ask === "district" ? D.districtNames : D.farmCrops.slice(0, 15);

  return <>
    {open && <section className="assistant-panel" aria-label={c.assistant}>
      <header className="assistant-header"><span className="assistant-avatar"><img src={agrilensLogo} alt="" /></span><div><b>{c.assistant}</b><small>{isRw ? "Inama zishingiye ku makuru yo mu Rwanda" : "Rwanda agriculture guide"}</small></div><button onClick={() => setOpen(false)} aria-label={c.close}><X size={19} /></button></header>
      <div className="assistant-body" aria-live="polite">
        {!messages.length && <div className="assistant-welcome"><div className="assistant-avatar"><img src={agrilensLogo} alt="" /></div><b>{c.assistant}</b><p>{c.assistantIntro}</p><div className="assistant-suggestions">{(isRw ? ["Umusaruro w'ibigori i Musanze", "Amazi yo kuhira mu karere ka Kayonza", "Nigute nabika imyaka?"] : SUGGESTIONS).map((q) => <button key={q} onClick={() => ask(q)}>{q}</button>)}</div></div>}
        {messages.map((m, i) => <div className="assistant-message" key={`${i}-${m.question}`}>
          <p className="assistant-user">{m.question}</p>
          {m.result.plan?.step ? <div className="assistant-answer"><p>{m.result.question}</p><div className="assistant-plan-summary">{Object.entries(m.result.plan.answers).filter(([, value]) => value).map(([key, value]) => <span key={key}>{key === "areaHa" ? `${parseArea(value).toFixed(2)} ha` : value}</span>)}</div><div className="assistant-picks">{m.result.plan.choices.map(({ value, label }) => <button key={value} onClick={() => submitPlanAnswer(i, value)}>{label}</button>)}</div></div> : m.result.ask ? <div className="assistant-answer"><p>{isRw ? m.result.ask === "district" ? "Ni akahe karere umurima wawe uherereyemo?" : "Ni ikihe gihingwa wifuza kubazaho?" : m.result.question}</p><div className="assistant-picks">{options(m.result).map((v) => <button key={v} onClick={() => pick(m, v)}>{v}</button>)}</div></div> : <AssistantMessage result={m.result} isRw={isRw} />}
          {m.result.followUps?.length > 0 && <div className="assistant-suggestions">{m.result.followUps.slice(0, 2).map((q) => <button key={q} onClick={() => ask(q)}>{q}</button>)}</div>}
        </div>)}
      </div>
      <form className="assistant-compose" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={c.typeQuestion} aria-label={c.typeQuestion} />
        <button type="submit" aria-label={c.send} disabled={!text.trim()}><Send size={18} /></button>
      </form>
    </section>}
    <button type="button" className={`assistant-launcher ${open ? "is-open" : ""}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? c.close : c.askAi}>
      {open ? <X size={22} /> : <><img src={agrilensLogo} alt="" /><span>{c.askAi}</span></>}
    </button>
  </>;
}
