import { useEffect, useMemo, useState } from "react";

import { bodyCompositionService } from "../services/bodyCompositionService";
import { physicalAssessmentService } from "../services/physicalAssessmentService";

import type {
  BiologicalSex,
  BodyCompositionComparison,
  BodyCompositionProfile,
  PhysicalAssessmentEvolution,
} from "../types/bodyComposition";

import type {
  PhysicalAssessment,
  PhysicalAssessmentPhoto,
  PhysicalAssessmentPhotoType,
  PhysicalAssessmentSummary,
} from "../types/physicalAssessment";

interface Props {
  assessments: PhysicalAssessmentSummary[];
}

const photoTypes: {
  type: PhysicalAssessmentPhotoType;
  label: string;
}[] = [
  { type: 0, label: "Frente" },
  { type: 1, label: "Costas" },
  { type: 2, label: "Lateral esquerda" },
  { type: 3, label: "Lateral direita" },
];

const tapeFields: {
  key:
    | "neckCm"
    | "shouldersCm"
    | "chestCm"
    | "waistCm"
    | "waistAtNavelCm"
    | "abdomenCm"
    | "hipCm"
    | "rightArmRelaxedCm"
    | "leftArmRelaxedCm"
    | "rightArmFlexedCm"
    | "leftArmFlexedCm"
    | "rightThighCm"
    | "leftThighCm"
    | "rightCalfCm"
    | "leftCalfCm";
  label: string;
}[] = [
  { key: "neckCm", label: "Pescoço" },
  { key: "shouldersCm", label: "Ombros" },
  { key: "chestCm", label: "Peitoral" },
  { key: "waistCm", label: "Cintura fina" },
  { key: "waistAtNavelCm", label: "Cintura no umbigo" },
  { key: "abdomenCm", label: "Abdômen" },
  { key: "hipCm", label: "Quadril" },
  { key: "rightArmRelaxedCm", label: "Braço D relaxado" },
  { key: "leftArmRelaxedCm", label: "Braço E relaxado" },
  { key: "rightArmFlexedCm", label: "Braço D contraído" },
  { key: "leftArmFlexedCm", label: "Braço E contraído" },
  { key: "rightThighCm", label: "Coxa direita" },
  { key: "leftThighCm", label: "Coxa esquerda" },
  { key: "rightCalfCm", label: "Panturrilha direita" },
  { key: "leftCalfCm", label: "Panturrilha esquerda" },
];

const skinfoldFields: {
  key:
    | "chestMm"
    | "abdomenMm"
    | "thighMm"
    | "tricepsMm"
    | "subscapularMm"
    | "suprailiacMm"
    | "midaxillaryMm";
  label: string;
}[] = [
  { key: "chestMm", label: "Peitoral" },
  { key: "abdomenMm", label: "Abdômen" },
  { key: "thighMm", label: "Coxa" },
  { key: "tricepsMm", label: "Tríceps" },
  { key: "subscapularMm", label: "Subescapular" },
  { key: "suprailiacMm", label: "Supra-ilíaca" },
  { key: "midaxillaryMm", label: "Axilar média" },
];

export default function PhysicalAssessmentAnalytics({ assessments }: Props) {
  const [profile, setProfile] = useState<BodyCompositionProfile | null>(null);

  const [birthDate, setBirthDate] = useState("");

  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex>(0);

  const [evolution, setEvolution] =
    useState<PhysicalAssessmentEvolution | null>(null);

  const [firstId, setFirstId] = useState<number | null>(null);

  const [secondId, setSecondId] = useState<number | null>(null);

  const [firstAssessment, setFirstAssessment] =
    useState<PhysicalAssessment | null>(null);

  const [secondAssessment, setSecondAssessment] =
    useState<PhysicalAssessment | null>(null);

  const [firstPhotos, setFirstPhotos] = useState<PhysicalAssessmentPhoto[]>([]);

  const [secondPhotos, setSecondPhotos] = useState<PhysicalAssessmentPhoto[]>(
    [],
  );

  const [comparison, setComparison] =
    useState<BodyCompositionComparison | null>(null);

  const [profileRevision, setProfileRevision] = useState(0);
  const [comparisonKey, setComparisonKey] = useState("");
  const [comparisonErrorKey, setComparisonErrorKey] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  const assessmentSignature = useMemo(
    () =>
      assessments
        .map((item) => `${item.id}:${item.assessmentDate}:${item.weightKg}`)
        .join("|"),
    [assessments],
  );

  const defaultFirstId =
    assessments.length >= 2
      ? assessments[assessments.length - 1].id
      : (assessments[0]?.id ?? null);

  const defaultSecondId = assessments[0]?.id ?? null;

  const effectiveFirstId = firstId ?? defaultFirstId;

  const effectiveSecondId = secondId ?? defaultSecondId;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [loadedProfile, loadedEvolution] = await Promise.all([
          bodyCompositionService.getProfile(),
          bodyCompositionService.getEvolution(),
        ]);

        if (cancelled) return;

        setProfile(loadedProfile);

        setBirthDate(loadedProfile.birthDate ?? "");

        setBiologicalSex(loadedProfile.biologicalSex ?? 0);

        setEvolution(loadedEvolution);
      } catch (error) {
        if (cancelled) return;

        setError(getErrorMessage(error));
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [assessmentSignature]);

  useEffect(() => {
    if (
      !effectiveFirstId ||
      !effectiveSecondId ||
      effectiveFirstId === effectiveSecondId
    ) {
      return;
    }

    let cancelled = false;

    async function loadComparison() {
      try {
        const [
          loadedComparison,
          loadedFirst,
          loadedSecond,
          loadedFirstPhotos,
          loadedSecondPhotos,
        ] = await Promise.all([
          bodyCompositionService.compare(effectiveFirstId!, effectiveSecondId!),

          physicalAssessmentService.getById(effectiveFirstId!),

          physicalAssessmentService.getById(effectiveSecondId!),

          physicalAssessmentService.getPhotos(effectiveFirstId!),

          physicalAssessmentService.getPhotos(effectiveSecondId!),
        ]);

        if (cancelled) return;

        setComparison(loadedComparison);
        setComparisonKey(`${effectiveFirstId}:${effectiveSecondId}:${profileRevision}`);
        setError(null);

        setFirstAssessment(loadedFirst);

        setSecondAssessment(loadedSecond);

        setFirstPhotos(loadedFirstPhotos);

        setSecondPhotos(loadedSecondPhotos);
      } catch (error) {
        if (cancelled) return;

        setComparisonErrorKey(`${effectiveFirstId}:${effectiveSecondId}:${profileRevision}`);
        setError(getErrorMessage(error));
      }
    }

    void loadComparison();

    return () => {
      cancelled = true;
    };
  }, [effectiveFirstId, effectiveSecondId, assessmentSignature, profileRevision]);

  async function saveProfile() {
    if (!birthDate) {
      setError("Informe sua data de nascimento.");

      return;
    }

    setProfileSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await bodyCompositionService.updateProfile({
        birthDate,
        biologicalSex,
      });

      setProfile(updated);
      setProfileRevision(value => value + 1);

      const loadedEvolution = await bodyCompositionService.getEvolution();

      setEvolution(loadedEvolution);

      setMessage("Perfil corporal atualizado.");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setProfileSaving(false);
    }
  }

  const canCompare =
    assessments.length >= 2 &&
    effectiveFirstId !== null &&
    effectiveSecondId !== null &&
    effectiveFirstId !== effectiveSecondId &&
    (assessments.find(a => a.id === effectiveFirstId)?.assessmentDate ?? "") <= (assessments.find(a => a.id === effectiveSecondId)?.assessmentDate ?? "");

  return (
    <section className="space-y-6">
      <header className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Analytics corporal
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-foreground">
          Comparação & Evolução
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-muted">
          Compare avaliações, acompanhe medidas, composição corporal e evolução
          visual.
        </p>
      </header>

      {error && <Notice>{error}</Notice>}

      {message && <Notice>{message}</Notice>}

      <details className="dash-panel"><summary>Configurar perfil para composição corporal</summary>

        <p className="mt-1 text-sm text-muted">
          Utilizado somente para calcular a estimativa pelo protocolo de dobras.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Data de nascimento</Label>

            <input
              type="date"
              aria-label="Data de nascimento"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <Label>Sexo biológico usado pelo protocolo</Label>

            <select
              aria-label="Sexo biológico usado pelo protocolo"
              value={biologicalSex}
              onChange={(event) =>
                setBiologicalSex(Number(event.target.value) as BiologicalSex)
              }
              className={inputClass}
            >
              <option value={0}>Masculino</option>

              <option value={1}>Feminino</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled={profileSaving}
              onClick={() => void saveProfile()}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-50"
            >
              {profileSaving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </div>

        {profile?.birthDate && profile.biologicalSex !== null && (
          <p className="mt-4 text-xs text-muted">
            Perfil configurado. O percentual de gordura é uma estimativa, não um
            diagnóstico clínico.
          </p>
        )}
      </details>


      <div className="rounded-[20px] border border-border bg-card p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-foreground">
          Comparar avaliações
        </h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Avaliação inicial</Label>

            <select
              aria-label="Avaliação inicial"
              value={effectiveFirstId ?? ""}
              onChange={(event) => setFirstId(Number(event.target.value))}
              className={inputClass}
            >
              {assessments
                .slice()
                .reverse()
                .map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {formatDate(assessment.assessmentDate)} —{" "}
                    {assessment.weightKg} kg
                  </option>
                ))}
            </select>
          </div>

          <div>
            <Label>Avaliação final</Label>

            <select
              aria-label="Avaliação final"
              value={effectiveSecondId ?? ""}
              onChange={(event) => setSecondId(Number(event.target.value))}
              className={inputClass}
            >
              {assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {formatDate(assessment.assessmentDate)} —{" "}
                  {assessment.weightKg} kg
                </option>
              ))}
            </select>
          </div>
        </div>

        {!canCompare && (
          <p className="mt-4 text-sm text-muted">
            Selecione duas avaliações diferentes, com a inicial anterior à final.
          </p>
        )}
      </div>

      {canCompare && comparisonKey !== `${effectiveFirstId}:${effectiveSecondId}:${profileRevision}` && <p role="status" className="progress-muted">{comparisonErrorKey === `${effectiveFirstId}:${effectiveSecondId}:${profileRevision}` ? "Comparação indisponível. Selecione as avaliações novamente para tentar." : "Carregando comparação…"}</p>}
      {canCompare && comparisonKey === `${effectiveFirstId}:${effectiveSecondId}:${profileRevision}` && comparison && firstAssessment && secondAssessment && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ComparisonMetric
              label="Peso"
              first={comparison.first.weightKg}
              second={comparison.second.weightKg}
              difference={comparison.weightChangeKg}
              suffix=" kg"
            />

            <ComparisonMetric
              label="% gordura"
              first={comparison.first.bodyFatPercentage}
              second={comparison.second.bodyFatPercentage}
              difference={comparison.bodyFatChangePercentagePoints}
              suffix=" p.p."
              valueSuffix="%"
            />

            <ComparisonMetric
              label="Massa gorda"
              first={comparison.first.fatMassKg}
              second={comparison.second.fatMassKg}
              difference={comparison.fatMassChangeKg}
              suffix=" kg"
            />

            <ComparisonMetric
              label="Massa magra"
              first={comparison.first.leanMassKg}
              second={comparison.second.leanMassKg}
              difference={comparison.leanMassChangeKg}
              suffix=" kg"
            />

            <ComparisonMetric label="IMC" first={comparison.first.bmi} second={comparison.second.bmi} difference={comparison.first.bmi !== null && comparison.second.bmi !== null ? comparison.second.bmi - comparison.first.bmi : null} suffix="" />
            <ComparisonMetric
              label="7 dobras"
              first={comparison.first.sevenSkinfoldSumMm}
              second={comparison.second.sevenSkinfoldSumMm}
              difference={comparison.sevenSkinfoldSumChangeMm}
              suffix=" mm"
            />
          </div>

          <ComparisonTable
            title="Circunferências"
            unit="cm"
            rows={tapeFields.map((field) => ({
              label: field.label,

              first: firstAssessment.tapeMeasurements[field.key],

              second: secondAssessment.tapeMeasurements[field.key],
            }))}
          />

          <ComparisonTable
            title="Dobras cutâneas"
            unit="mm"
            rows={skinfoldFields.map((field) => ({
              label: field.label,

              first: firstAssessment.skinfoldMeasurements?.[field.key] ?? null,

              second:
                secondAssessment.skinfoldMeasurements?.[field.key] ?? null,
            }))}
          />

          <PhotoComparison
            firstDate={firstAssessment.assessmentDate}
            secondDate={secondAssessment.assessmentDate}
            firstPhotos={firstPhotos}
            secondPhotos={secondPhotos}
          />

          <div className="rounded-[20px] border border-border bg-card p-4 text-xs leading-5 text-muted sm:p-6">
            Percentual de gordura calculado somente quando as sete dobras, idade
            e sexo biológico necessários ao protocolo estão disponíveis. Método:{" "}
            <span className="text-foreground">
              Jackson-Pollock 7 dobras + Siri
            </span>
            .
          </div>
        </>
      )}
      {evolution && evolution.points.length < 2 && <p className="dash-panel progress-muted">Os gráficos de evolução estarão disponíveis após a segunda avaliação.</p>}
      {evolution && evolution.points.length > 1 && (
        <div className="grid gap-4 md:grid-cols-2">
          <TrendCard
            title="Peso"
            suffix=" kg"
            points={evolution.points.map((point) => ({
              date: point.assessmentDate,
              value: point.weightKg,
            }))}
          />

          <TrendCard title="Massa magra" suffix=" kg" points={evolution.points.map(point => ({date: point.assessmentDate, value: point.leanMassKg}))} />
          <TrendCard
            title="Cintura"
            suffix=" cm"
            points={evolution.points.map((point) => ({
              date: point.assessmentDate,
              value: point.waistCm,
            }))}
          />

          <TrendCard
            title="Abdômen"
            suffix=" cm"
            points={evolution.points.map((point) => ({
              date: point.assessmentDate,
              value: point.abdomenCm,
            }))}
          />

          <TrendCard
            title="% de gordura"
            suffix="%"
            points={evolution.points.map((point) => ({
              date: point.assessmentDate,
              value: point.bodyFatPercentage,
            }))}
          />
        </div>
      )}

    </section>
  );
}

function ComparisonMetric({
  label,
  first,
  second,
  difference,
  suffix,
  valueSuffix,
}: {
  label: string;
  first: number | null;
  second: number | null;
  difference: number | null;
  suffix: string;
  valueSuffix?: string;
}) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-4">
      <p className="text-xs text-muted">{label}</p>

      <p className="mt-2 text-lg font-semibold text-foreground">
        {formatValue(first, valueSuffix ?? suffix)}
        <span className="mx-2 text-muted">→</span>
        {formatValue(second, valueSuffix ?? suffix)}
      </p>

      <p className="mt-2 text-xs text-muted">
        Diferença:{" "}
        <span className="font-medium text-foreground">
          {formatDelta(difference, suffix)}
        </span>
      </p>
      {first !== null && first !== 0 && difference !== null && <p className="mt-2 progress-muted">Variação relativa: {formatDelta(difference / Math.abs(first) * 100, "%")}</p>}
    </div>
  );
}

function ComparisonTable({
  title,
  unit,
  rows,
}: {
  title: string;
  unit: string;
  rows: {
    label: string;
    first: number | null;
    second: number | null;
  }[];
}) {
  const visible = rows.filter(row => row.first !== null || row.second !== null);
  return <details className="dash-panel" open={title === "Circunferências"}><summary>{title}</summary>
    {!visible.length ? <p className="progress-muted">Sem medidas registradas.</p> : <div className="progress-grid mt-4">{visible.map(row => <ComparisonMetric key={row.label} label={row.label} first={row.first} second={row.second} difference={row.first !== null && row.second !== null ? row.second-row.first : null} suffix={` ${unit}`} />)}</div>}
  </details>;
}

function PhotoComparison({
  firstDate,
  secondDate,
  firstPhotos,
  secondPhotos,
}: {
  firstDate: string;
  secondDate: string;
  firstPhotos: PhysicalAssessmentPhoto[];
  secondPhotos: PhysicalAssessmentPhoto[];
}) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-foreground">Comparação visual</h3>

      {!firstPhotos.length && !secondPhotos.length && <p className="progress-muted mt-4">Nenhuma foto nas avaliações selecionadas.</p>}
      <div className="mt-5 space-y-6">
        {photoTypes.map((photoType) => {
          const first = firstPhotos.find(
            (photo) => photo.type === photoType.type,
          );

          const second = secondPhotos.find(
            (photo) => photo.type === photoType.type,
          );

          if (!first && !second) return null;
          return (
            <details key={photoType.type} open={photoType.type === 0}>
              <summary className="mb-3 text-sm font-medium text-foreground">
                {photoType.label}
              </summary>

              <div className="grid gap-3 sm:grid-cols-2">
                <PhotoBox label={formatDate(firstDate)} photo={first} />

                <PhotoBox label={formatDate(secondDate)} photo={second} />
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function PhotoBox({
  label,
  photo,
}: {
  label: string;
  photo: PhysicalAssessmentPhoto | undefined;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden">
        {photo ? (
          <a
            href={photo.url}
            target="_blank"
            rel="noreferrer"
            className="h-full w-full"
          >
            <img
              src={photo.url}
              alt={label}
              className="h-full w-full object-contain"
            />
          </a>
        ) : (
          <span className="text-sm text-muted">Sem foto</span>
        )}
      </div>

      <div className="border-t border-border px-3 py-2 text-xs text-muted">
        {label}
      </div>
    </div>
  );
}

function TrendCard({
  title,
  suffix,
  points,
}: {
  title: string;
  suffix: string;
  points: {
    date: string;
    value: number | null;
  }[];
}) {
  const valid = [...points].sort((a,b) => a.date.localeCompare(b.date)).filter(
    (
      point,
    ): point is {
      date: string;
      value: number;
    } => point.value !== null,
  );

  return (
    <div className="rounded-[20px] border border-border bg-card p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>

      {valid.length < 2 ? (
        <p className="mt-6 text-sm text-muted">Dados insuficientes.</p>
      ) : (
        <>
          <MiniLineChart points={valid} />

          <div className="mt-3 flex justify-between text-xs text-muted">
            <span>{formatDate(valid[0].date)}</span>

            <span className="font-medium text-foreground">
              {formatValue(valid[valid.length - 1].value, suffix)}
            </span>

            <span>{formatDate(valid[valid.length - 1].date)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function MiniLineChart({
  points,
}: {
  points: {
    date: string;
    value: number;
  }[];
}) {
  const width = 600;

  const height = 160;

  const padding = 12;

  const values = points.map((point) => point.value);

  const minimum = Math.min(...values);

  const maximum = Math.max(...values);

  const range = maximum - minimum || 1;

  const coordinates = points.map((point, index) => {
    const x =
      padding +
      (index / Math.max(points.length - 1, 1)) * (width - padding * 2);

    const y =
      height -
      padding -
      ((point.value - minimum) / range) * (height - padding * 2);

    return {
      x,
      y,
      value: point.value,
    };
  });

  const polyline = coordinates
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-4 h-40 w-full text-foreground"
      role="img"
      aria-label="Evolução dos valores nas datas registradas"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />

      {coordinates.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="currentColor"
        ><title>{formatDate(points[index].date)}: {formatValue(point.value)}</title></circle>
      ))}
    </svg>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-muted">
      {children}
    </label>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
      {children}
    </div>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");

  return year && month && day ? `${day}/${month}/${year}` : value;
}

function formatValue(value: number | null, suffix = "") {
  if (value === null) return "—";

  return `${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
}

function formatDelta(value: number | null, suffix: string) {
  if (value === null) return "—";

  const prefix = value > 0 ? "+" : "";

  return `${prefix}${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-border";
