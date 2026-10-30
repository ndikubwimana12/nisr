import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Sprout } from "lucide-react";
import { useData } from "../data";
import { useFarm } from "../farm";
import { useLanguage } from "../language";
import { fmt, pct } from "../format";

const PALETTE = ["#e2eff8", "#b8d6eb", "#82b8da", "#4696c6", "#0b63b4"];
const NO_VALUE = "#e6e9ed";
const pointList = (geometry) => (geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates).flatMap((polygon) => polygon.flatMap((ring) => ring));
const pathFor = (geometry) => (geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates)
  .map((polygon) => polygon.map((ring) => ring.map(([x, y], i) => `${i ? "L" : "M"}${x} ${-y}`).join(" ") + " Z").join(" ")).join(" ");

function shapeBox(points, padding = 0.14) {
  const xs = points.map((p) => p[0]), ys = points.map((p) => -p[1]);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const px = Math.max((x1 - x0) * padding, 0.02), py = Math.max((y1 - y0) * padding, 0.02);
  x0 -= px; x1 += px; y0 -= py; y1 += py;
    const aspect = 1.18, width = x1 - x0, height = y1 - y0;
  if (width / height < aspect) { const extra = (height * aspect - width) / 2; x0 -= extra; x1 += extra; }
  else { const extra = (width / aspect - height) / 2; y0 -= extra; y1 += extra; }
  return `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
}

function cutsFor(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return [0.2, 0.4, 0.6, 0.8].map((p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]).filter(Number.isFinite);
}

function DistrictInset({ feature, district, label }) {
  if (!feature) return null;
  return <div className="district-inset" aria-label={`${label}: ${district}`}>
    <span>{label}</span>
    <svg viewBox={shapeBox(pointList(feature.geometry))} role="img" aria-label={`${district} highlighted`}>
      <path key={district} className="district-inset-shape" d={pathFor(feature.geometry)} fill="#71bd91" stroke="#0b63b4" strokeWidth="0.009" />
    </svg>
    <b>{district}</b>
  </div>;
}

function RwandaMap({ D, district, values, onSelect, colorOf, insetLabel, caption }) {
  const map = useMemo(() => {
    const features = D.geo.features.map((feature) => ({
      feature, d: pathFor(feature.geometry),
    }));
    const points = D.geo.features.flatMap((feature) => pointList(feature.geometry));
    return { features, box: shapeBox(points, 0.04) };
  }, [D.geo]);
  return <div className="rwanda-map-frame">
    <svg className="rwanda-map" viewBox={map.box} role="img" aria-label={caption} preserveAspectRatio="xMidYMid meet">
      {map.features.map(({ feature, d }) => {
        const name = feature.properties.district, selected = name === district;
        return <path key={name} d={d} fill={selected ? "#71bd91" : colorOf(values[name])}
          stroke={selected ? "#075087" : "#fff"} strokeWidth={selected ? "0.009" : "0.006"}
          className="rwanda-district" onClick={() => onSelect(name)}>
          <title>{name}: {values[name] == null ? "No supported data" : `${fmt(values[name])} kg/ha`}</title>
        </path>;
      })}
    </svg>
  </div>;
}

function Legend({ cuts, format, labels }) {
  const ranges = cuts.length >= 4
    ? [`< ${format(cuts[0])}`, ...cuts.slice(0, 3).map((x, i) => `${format(x)} – ${format(cuts[i + 1])}`), `≥ ${format(cuts[3])}`]
    : [labels.noData];
  return <div className="map-legend" aria-label={labels.legend}>
    {ranges.map((range, i) => <span key={range}><i style={{ background: cuts.length >= 4 ? PALETTE[i] : NO_VALUE }} />{range}</span>)}
    <span><i style={{ background: NO_VALUE }} />{labels.noData}</span>
    <span><i className="legend-selected" />{labels.selected}</span>
  </div>;
}

function Actions({ districtRow, scenario, crop, isRw }) {
  const input = scenario?.inputs;
  const actions = isRw ? [
    input ? `Ganira n'umujyanama ku gukoresha ${input.toLowerCase()} kuri ${crop}.` : `Baza umujyanama imbuto n'intera bikwiriye ${crop}.`,
    districtRow?.erosion_threat_rate > 0.15 ? "Rinda ubutaka n'amaterasi cyangwa ibyatsi." : "Subiza ibisigazwa by'ibihingwa mu butaka.",
    districtRow?.no_water_rate > 0.35 ? "Bika amazi y'imvura kandi upfundikire ubutaka." : "Reba ubuhehere mbere yo kuhira.",
  ] : [
    input ? `Discuss ${input.toLowerCase()} for ${crop} with local extension staff.` : `Ask extension staff about ${crop} seed and spacing.`,
    districtRow?.erosion_threat_rate > 0.15 ? "Protect slopes with grass strips or terraces." : "Return crop residues to the soil.",
    districtRow?.no_water_rate > 0.35 ? "Harvest rainwater and mulch to conserve moisture." : "Check soil moisture before watering.",
  ];
  return <ul className="map-actions">{actions.map((action) => <li key={action}><Sprout size={16} />{action}</li>)}</ul>;
}

function MapPanel({ type, D, district, crop, values, row, scenario, districtRow, districtCrops, colorOf, cuts, onSelect, onHover, onCropChange, cropOptions, filterLabels, isRw }) {
  const isPrediction = type === "prediction";
  const title = isPrediction ? (isRw ? "Umusaruro ushoboka mu gihembwe gitaha" : "Next season productivity") : (isRw ? "Umusaruro wabonetse" : "Current productivity");
  const value = isPrediction ? scenario?.withInputs : row?.median;
  const changeFromObserved = row?.median > 0 && scenario?.withInputs != null ? scenario.withInputs / row.median - 1 : null;
  const noData = isPrediction ? (isRw ? "Nta shusho iboneka kuri iki gihingwa muri aka karere." : "No supported next-season scenario is available for this crop and district.") : (isRw ? "Nta makuru ahagije ku musaruro muri aka karere." : "There is not enough survey data for this district estimate.");
  const labels = isRw ? { noData: "Nta makuru", selected: "Hitamo akarere", legend: "Ibara ry'umusaruro" } : { noData: "No data", selected: "Selected district", legend: "Yield legend" };

  return <article className="big-map-card">
    <header className="big-map-heading">
      <div><span>{isPrediction ? "02" : "01"}</span><div><h2>{title}</h2><p>{crop} · {district} · {isPrediction ? "Survey input scenario" : "AHS 2024 observed median"}</p></div></div>
      {isPrediction ? <span className="map-status map-status-prediction">{isRw ? "Ishusho" : "Scenario"}</span> : <div className="map-heading-filters">
        <label><span>{filterLabels.district}</span><select value={district} onChange={(event) => onSelect(event.target.value)}>{D.districtNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label><span>{filterLabels.crop}</span><select value={crop} onChange={(event) => onCropChange(event.target.value)}>{cropOptions.map((name) => <option key={name}>{name}</option>)}</select></label>
      </div>}
    </header>
    <div className="map-main-row" onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
      <div className="map-visual-column">
        <RwandaMap D={D} district={district} values={values} onSelect={onSelect} colorOf={colorOf} caption={`${title}, Rwanda's 30 districts`} />
        <Legend cuts={cuts} format={(n) => `${fmt(n)} kg/ha`} labels={labels} />
      </div>
      <aside className="map-data-column">
        <DistrictInset feature={D.geo.features.find((feature) => feature.properties.district === district)} district={district} label={isRw ? "Akarere katoranyijwe" : "Selected district"} />
        <div className="map-data-panel">
          <div className="map-primary-stat"><span>{isPrediction ? (isRw ? "Umusaruro ushoboka" : "Scenario yield") : (isRw ? "Umusaruro wo hagati" : "Observed median yield")}</span><b>{value == null ? "—" : `${fmt(value)} kg/ha`}</b></div>
          {isPrediction ? scenario ? <>
            <div className="scenario-inputs"><span>{isRw ? "Ibikorwa" : "Inputs"}</span><b>{scenario.inputs || "—"}</b></div>
            <div className="map-data-grid map-factor-grid">
              <span>{isRw ? "Ugereranyije n'ubu" : "Vs observed"}<b>{pct(changeFromObserved, true)}</b></span>
              <span>{isRw ? "Ugereranyije n'ibipimo" : "Vs baseline"}<b>{pct(scenario.gain, true)}</b></span>
              <span>{isRw ? "Iteganyagihe" : "Rain forecast"}<b>{isRw ? "Ntaryo" : "Unavailable"}</b></span>
            </div>
            <p className="map-section-label">{isRw ? "Ibipimo by'akarere" : "District factors"}</p>
            <div className="map-data-grid map-factor-grid">
              <span>{isRw ? "Nta mazi hafi" : "No nearby water"}<b>{pct(districtRow?.no_water_rate)}</b></span>
              <span>{isRw ? "Umusaruro wagabanutse" : "Production down"}<b>{pct(districtRow?.production_decreased_rate)}</b></span>
              <span>{isRw ? "Isuri" : "Erosion"}<b>{pct(districtRow?.erosion_threat_rate)}</b></span>
            </div>
            <p className="map-section-label">{isRw ? "Ibyo wakora" : "Recommended actions"}</p>
            <Actions districtRow={districtRow} scenario={scenario} crop={crop} isRw={isRw} />
            <p className="map-brief-note">{isRw ? "Ishusho y'ubushakashatsi; si isezerano." : "Survey scenario; not a guarantee or weather forecast."}</p>
          </> : <p className="map-explanation">{noData}</p> : row ? <>
            <div className="map-data-grid">
              <span>{isRw ? "Imirima" : "Survey plots"}<b>{fmt(row.n)}</b></span>
              <span>{isRw ? "Quartile yo hejuru" : "Upper quartile"}<b>{fmt(row.p75)} kg/ha</b></span>
              <span>{isRw ? "Umwaka" : "Year"}<b>2024</b></span>
            </div>
            <p className="map-section-label">{isRw ? `Ibihingwa bikunze muri ${district}` : `Common crops · ${district}`}</p>
            <div className="district-summary-crops">{districtCrops.map((item) => <button type="button" key={item.crop} aria-pressed={crop === item.crop} onClick={() => onCropChange(item.crop)}>{item.crop}<b>{fmt(item.median)} kg/ha</b></button>)}</div>
            <p className="map-section-label">{isRw ? "Imiterere y'ubuhinzi" : "Farm conditions"}</p>
            <div className="map-data-grid map-factor-grid">
              <span>{isRw ? "Kuhira" : "Irrigated"}<b>{pct(districtRow?.irrigated_rate)}</b></span>
              <span>{isRw ? "Ifumbire" : "Fertilizer"}<b>{pct(districtRow?.inorganic_fertilizer_rate)}</b></span>
              <span>{isRw ? "Isuri" : "Erosion"}<b>{pct(districtRow?.erosion_threat_rate)}</b></span>
            </div>
            <Link className="district-report-link" to={`/districts/${encodeURIComponent(district)}`}>{isRw ? "Raporo y'akarere" : "Investigate district report"}</Link>
          </> : <p className="map-explanation">{noData}</p>}
        </div>
      </aside>
    </div>
  </article>;
}

export default function DistrictShowcase() {
  const D = useData(), { farm, setFarm } = useFarm(), { isRw } = useLanguage();
  const [district, setDistrict] = useState(farm.district && D.districtNames.includes(farm.district) ? farm.district : D.districtNames[0]);
  const [crop, setCrop] = useState("Maize");
  const [hovered, setHovered] = useState(false);
  const [locationState, setLocationState] = useState("");

  const currentValues = useMemo(() => Object.fromEntries(D.districtsForCrop(crop).map((item) => [item.district, item.median])), [D, crop]);
  const predictedValues = useMemo(() => Object.fromEntries(D.scenarios.filter((item) => item.crop === crop).map((item) => [item.district, item.withInputs])), [D, crop]);
  const cuts = useMemo(() => cutsFor([...Object.values(currentValues), ...Object.values(predictedValues)]), [currentValues, predictedValues]);
  const colorOf = (value) => value == null || !Number.isFinite(value) ? NO_VALUE : PALETTE[Math.min(4, cuts.filter((cut) => value >= cut).length)];
  const row = D.getDistrictCrop(district, crop), scenario = D.getScenario(district, crop), districtRow = D.getDistrict(district);
  const options = D.farmCrops;

  useEffect(() => {
    if (hovered || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setDistrict((current) => D.districtNames[(D.districtNames.indexOf(current) + 1) % D.districtNames.length]), 5000);
    return () => clearInterval(timer);
  }, [hovered, D.districtNames]);
  const choose = (next) => { setDistrict(next); setFarm({ district: next }); };
  const locate = () => {
    if (!navigator.geolocation) { setLocationState(isRw ? "Aho uherereye ntihabonetse." : "Location is not available in this browser."); return; }
    setLocationState(isRw ? "Turashaka akarere…" : "Finding your district…");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const found = D.geo.features.find((feature) => {
        const rings = (feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates).flatMap((polygon) => [polygon[0]]);
        return rings.some((ring) => {
          let inside = false;
          for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i], [xj, yj] = ring[j];
            if ((yi > coords.latitude) !== (yj > coords.latitude) && coords.longitude < ((xj - xi) * (coords.latitude - yi)) / ((yj - yi) || 1e-12) + xi) inside = !inside;
          }
          return inside;
        });
      })?.properties?.district;
      if (found) { setDistrict(found); setFarm({ district: found }); setLocationState(isRw ? `Akarere wabonetse: ${found}` : `Your district: ${found}`); }
      else setLocationState(isRw ? "Ntitwashoboye kubona akarere kawe. Hitamo kamwe ku rutonde." : "Could not match your location to a district. Choose one from the list.");
    }, () => setLocationState(isRw ? "Ntitwashoboye kubona aho uherereye. Hitamo akarere." : "Location permission was declined or unavailable. Choose a district."), { enableHighAccuracy: false, timeout: 8000, maximumAge: 3600000 });
  };
  const cropsInDistrict = D.cropsInDistrict(district).filter((item) => item.n >= 30).sort((a, b) => b.n - a.n).slice(0, 4);
  const labels = isRw ? { district: "Akarere", crop: "Igihingwa", location: "Ahantu" } : { district: "District", crop: "Crop", location: "Use my location" };

  return <section className="district-showcase">
    <div className="wrap">
      <div className="maps-heading">
        <div><span>{isRw ? "UBUHINZI BW'U RWANDA" : "RWANDA AGRICULTURE"}</span><h1>{isRw ? "Umusaruro mu turere twose" : "Productivity across Rwanda"}</h1><p>{isRw ? "Gereranya umusaruro wabonetse n'ishusho y'inyongeramusaruro ku turere 30." : "Compare observed productivity with survey input scenarios across all 30 districts."}</p></div>
        <button type="button" className="location-button" onClick={locate}><MapPin size={17} />{labels.location}</button>
      </div>
      {locationState && <p className="location-status" role="status">{locationState}</p>}
      <div className="large-maps-grid">
        <MapPanel type="current" D={D} district={district} crop={crop} values={currentValues} row={row} scenario={scenario} districtRow={districtRow} districtCrops={cropsInDistrict} colorOf={colorOf} cuts={cuts} onSelect={choose} onCropChange={setCrop} cropOptions={options} filterLabels={labels} onHover={setHovered} isRw={isRw} />
        <MapPanel type="prediction" D={D} district={district} crop={crop} values={predictedValues} row={row} scenario={scenario} districtRow={districtRow} districtCrops={cropsInDistrict} colorOf={colorOf} cuts={cuts} onSelect={choose} onHover={setHovered} isRw={isRw} />
      </div>
      <p className="map-footnote">{isRw ? "Ishusho si iteganyagihe ry'imvura cyangwa isezerano ry'umusaruro. Amakuru y'imvura aturuka ku iteganyagihe ryizewe ntari muri dosiye zitangwa." : "The right map shows survey input scenarios, not a verified next-season forecast. No reliable rainfall forecast is included in the supplied datasets."}</p>
    </div>
  </section>;
}
